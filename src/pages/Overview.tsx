import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getExpenses, getProducts, getSaleItems, getSales, getStock } from '@/lib/api'
import { Card, PageHeader, StatTile, formatBRL } from '@/components/ui'
import type { Expense, Product, ProductStock, Sale, SaleItem } from '@/types/domain'

type PeriodPreset = 'mes' | 'ano' | 'total' | 'personalizado'

const periodLabels: Record<PeriodPreset, string> = {
  mes: 'Este mês',
  ano: 'Este ano',
  total: 'Total',
  personalizado: 'Personalizado',
}

function getPeriodRange(
  preset: PeriodPreset,
  customStart: string,
  customEnd: string,
): { start: Date | null; end: Date } {
  const now = new Date()
  if (preset === 'mes') return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now }
  if (preset === 'ano') return { start: new Date(now.getFullYear(), 0, 1), end: now }
  if (preset === 'total') return { start: null, end: now }
  return {
    start: customStart ? new Date(`${customStart}T00:00:00`) : null,
    end: customEnd ? new Date(`${customEnd}T23:59:59`) : now,
  }
}

export function Overview() {
  const [stock, setStock] = useState<ProductStock[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('mes')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  useEffect(() => {
    Promise.all([getStock(), getSales(), getSaleItems(), getExpenses(), getProducts()]).then(
      ([s, sa, si, ex, pr]) => {
        setStock(s)
        setSales(sa)
        setSaleItems(si)
        setExpenses(ex)
        setProducts(pr)
        setLoading(false)
      },
    )
  }, [])

  // KPIs que nunca mudam com o filtro de período — estoque é uma foto do
  // agora, e o faturamento total é sempre "desde o início".
  const globalKpis = useMemo(() => {
    const stockValue = stock.reduce((sum, p) => sum + p.quantity_in_stock * p.cost_price_brl, 0)
    const totalUnits = stock.reduce((sum, p) => sum + p.quantity_in_stock, 0)
    // "motor" é uma categoria de produto à parte (o motor funcional vendido
    // como opcional dos sets) — separado das unidades de sets propriamente
    // ditos (carro/moto) pra não misturar as duas contagens de estoque.
    const setUnits = stock.filter((p) => p.category !== 'motor').reduce((sum, p) => sum + p.quantity_in_stock, 0)
    const motorUnits = stock.filter((p) => p.category === 'motor').reduce((sum, p) => sum + p.quantity_in_stock, 0)
    const lowStock = stock.filter((p) => p.quantity_in_stock <= p.min_stock_alert)

    const totalRevenue = sales
      .filter((s) => s.status !== 'cancelado')
      .reduce((sum, s) => {
        const items = saleItems.filter((i) => i.sale_id === s.id)
        const itemsTotal = items.reduce((t, i) => t + i.quantity * i.unit_price_brl, 0)
        return sum + itemsTotal - s.discount_brl + s.shipping_cost_brl + (s.installment_fee_brl ?? 0)
      }, 0)

    return { stockValue, totalUnits, setUnits, motorUnits, lowStock, totalRevenue }
  }, [stock, sales, saleItems])

  // KPIs que respeitam o filtro de período selecionado.
  const kpis = useMemo(() => {
    const { start, end } = getPeriodRange(periodPreset, customStart, customEnd)
    const periodSales = sales.filter((s) => {
      if (s.status === 'cancelado') return false
      const d = new Date(s.sale_date)
      if (start && d < start) return false
      return d <= end
    })
    const revenue = periodSales.reduce((sum, s) => {
      const items = saleItems.filter((i) => i.sale_id === s.id)
      const itemsTotal = items.reduce((t, i) => t + i.quantity * i.unit_price_brl, 0)
      return sum + itemsTotal - s.discount_brl + s.shipping_cost_brl + (s.installment_fee_brl ?? 0)
    }, 0)
    const cost = periodSales.reduce((sum, s) => {
      const items = saleItems.filter((i) => i.sale_id === s.id)
      return sum + items.reduce((t, i) => t + i.quantity * i.unit_cost_brl, 0)
    }, 0)
    const periodExpenses = expenses
      .filter((e) => {
        const d = new Date(e.expense_date)
        if (start && d < start) return false
        return d <= end
      })
      .reduce((sum, e) => sum + e.amount_brl, 0)
    const margin = revenue - cost - periodExpenses

    return { revenue, margin, salesCount: periodSales.length, periodSales }
  }, [sales, saleItems, expenses, periodPreset, customStart, customEnd])

  const salesByDay = useMemo(() => {
    const days: { date: string; label: string; revenue: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      days.push({ date: key, label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), revenue: 0 })
    }
    for (const s of sales) {
      if (s.status === 'cancelado') continue
      const key = s.sale_date.slice(0, 10)
      const day = days.find((d) => d.date === key)
      if (!day) continue
      const items = saleItems.filter((i) => i.sale_id === s.id)
      day.revenue += items.reduce((t, i) => t + i.quantity * i.unit_price_brl, 0) - s.discount_brl
    }
    return days
  }, [sales, saleItems])

  const topModels = useMemo(() => {
    const revenueByProduct = new Map<string, number>()
    for (const s of kpis.periodSales) {
      const items = saleItems.filter((i) => i.sale_id === s.id)
      for (const i of items) {
        revenueByProduct.set(i.product_id, (revenueByProduct.get(i.product_id) ?? 0) + i.quantity * i.unit_price_brl)
      }
    }
    return Array.from(revenueByProduct.entries())
      .map(([productId, revenue]) => ({
        name: products.find((p) => p.id === productId)?.name ?? 'Produto removido',
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [kpis.periodSales, saleItems, products])

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Carregando...</div>

  return (
    <div>
      <PageHeader title="Visão geral" description="Resumo de estoque, vendas e resultado — filtre o período pra vendas e faturamento" />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['mes', 'ano', 'total', 'personalizado'] as PeriodPreset[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriodPreset(p)}
            className="rounded-full border px-3 py-1.5 text-xs font-medium transition"
            style={{
              borderColor: periodPreset === p ? 'var(--series-1)' : 'var(--border-hairline)',
              background: periodPreset === p ? 'var(--series-1)' : 'transparent',
              color: periodPreset === p ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {periodLabels[p]}
          </button>
        ))}
        {periodPreset === 'personalizado' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-lg border px-2 py-1.5 text-xs"
              style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
            />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>até</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-lg border px-2 py-1.5 text-xs"
              style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
            />
          </div>
        )}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label={`Faturamento — ${periodLabels[periodPreset]}`} value={formatBRL(kpis.revenue)} />
        <StatTile label={`Vendas — ${periodLabels[periodPreset]}`} value={String(kpis.salesCount)} sub="pedidos, exceto cancelados" />
        <StatTile
          label={`Margem — ${periodLabels[periodPreset]}`}
          value={formatBRL(kpis.margin)}
          status={kpis.margin >= 0 ? 'good' : 'critical'}
          sub={kpis.margin >= 0 ? 'Positiva' : 'Negativa'}
        />
      </div>

      <p className="mb-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        Sempre atualizados (sem filtro de período)
      </p>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="Faturamento total" value={formatBRL(globalKpis.totalRevenue)} sub="desde o início" />
        <StatTile label="Valor em estoque (custo)" value={formatBRL(globalKpis.stockValue)} sub={`${globalKpis.totalUnits} unidades no total`} />
        <StatTile label="Sets em estoque" value={String(globalKpis.setUnits)} sub="unidades — carros e motos" />
        <StatTile label="Motores em estoque" value={String(globalKpis.motorUnits)} sub="unidades — motores funcionais" />
        <StatTile
          label="Alertas de estoque baixo"
          value={String(globalKpis.lowStock.length)}
          status={globalKpis.lowStock.length > 0 ? 'warning' : 'good'}
          sub={globalKpis.lowStock.length > 0 ? globalKpis.lowStock.map((p) => p.sku).join(', ') : 'Tudo certo'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Faturamento — últimos 14 dias
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={salesByDay} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid stroke="var(--gridline)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={{ stroke: 'var(--baseline)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v) => `R$${Math.round(v / 100) / 10}k`}
              />
              <Tooltip
                formatter={(v) => formatBRL(Number(v))}
                contentStyle={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--series-1)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="mb-1 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Top 5 modelos mais vendidos (receita) — {periodLabels[periodPreset]}
          </h2>
          <p className="mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            Use isto para decidir o que priorizar no próximo container
          </p>
          {topModels.length === 0 ? (
            <div className="flex h-[240px] items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Ainda sem vendas registradas.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={topModels}
                layout="vertical"
                margin={{ left: 0, right: 24, top: 4, bottom: 0 }}
              >
                <CartesianGrid stroke="var(--gridline)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `R$${Math.round(v / 100) / 10}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                  axisLine={false}
                  tickLine={false}
                  width={140}
                />
                <Tooltip
                  formatter={(v) => formatBRL(Number(v))}
                  contentStyle={{
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="revenue" fill="var(--series-2)" radius={[0, 4, 4, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <p className="mt-6 text-xs" style={{ color: 'var(--text-muted)' }}>
        {products.length} produtos cadastrados.
      </p>
    </div>
  )
}
