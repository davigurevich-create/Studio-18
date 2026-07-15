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

export function Overview() {
  const [stock, setStock] = useState<ProductStock[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

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

  const kpis = useMemo(() => {
    const stockValue = stock.reduce((sum, p) => sum + p.quantity_in_stock * p.cost_price_brl, 0)
    const totalUnits = stock.reduce((sum, p) => sum + p.quantity_in_stock, 0)
    const lowStock = stock.filter((p) => p.quantity_in_stock <= p.min_stock_alert)

    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)
    const monthSales = sales.filter((s) => new Date(s.sale_date) >= thisMonth && s.status !== 'cancelado')
    const revenue = monthSales.reduce((sum, s) => {
      const items = saleItems.filter((i) => i.sale_id === s.id)
      const itemsTotal = items.reduce((t, i) => t + i.quantity * i.unit_price_brl, 0)
      return sum + itemsTotal - s.discount_brl + s.shipping_cost_brl
    }, 0)
    const cost = monthSales.reduce((sum, s) => {
      const items = saleItems.filter((i) => i.sale_id === s.id)
      return sum + items.reduce((t, i) => t + i.quantity * i.unit_cost_brl, 0)
    }, 0)
    const monthExpenses = expenses
      .filter((e) => new Date(e.expense_date) >= thisMonth)
      .reduce((sum, e) => sum + e.amount_brl, 0)
    const margin = revenue - cost - monthExpenses

    return { stockValue, totalUnits, lowStock, revenue, margin }
  }, [stock, sales, saleItems, expenses])

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
    for (const s of sales) {
      if (s.status === 'cancelado') continue
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
  }, [sales, saleItems, products])

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Carregando...</div>

  return (
    <div>
      <PageHeader title="Visão geral" description="Resumo de estoque, vendas e resultado do mês" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Faturamento do mês" value={formatBRL(kpis.revenue)} />
        <StatTile
          label="Margem do mês"
          value={formatBRL(kpis.margin)}
          status={kpis.margin >= 0 ? 'good' : 'critical'}
          sub={kpis.margin >= 0 ? 'Positiva' : 'Negativa'}
        />
        <StatTile label="Valor em estoque (custo)" value={formatBRL(kpis.stockValue)} sub={`${kpis.totalUnits} unidades`} />
        <StatTile
          label="Alertas de estoque baixo"
          value={String(kpis.lowStock.length)}
          status={kpis.lowStock.length > 0 ? 'warning' : 'good'}
          sub={kpis.lowStock.length > 0 ? kpis.lowStock.map((p) => p.sku).join(', ') : 'Tudo certo'}
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
            Top 5 modelos mais vendidos (receita)
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
