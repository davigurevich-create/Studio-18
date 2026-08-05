import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Bar, BarChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { addExpense, deleteExpense, getExpenses, getSaleItems, getSales } from '@/lib/api'
import { Badge, Button, Card, PageHeader, StatTile, formatBRL } from '@/components/ui'
import type { Expense, ExpenseCategory, ExpenseRecurrence, Sale, SaleItem } from '@/types/domain'

const paidByOptions = ['Davi', 'Rubens', 'Iwan']

const categoryLabels: Record<ExpenseCategory, string> = {
  importacao: 'Importação',
  marketing: 'Marketing',
  operacional: 'Operacional',
  frete: 'Frete',
  taxas: 'Taxas',
  outros: 'Outros',
}

const recurrenceLabels: Record<ExpenseRecurrence, string> = {
  pontual: 'Pontual',
  mensal: 'Mensal',
  anual: 'Anual',
}

const recurrenceTone: Record<ExpenseRecurrence, 'muted' | 'info'> = {
  pontual: 'muted',
  mensal: 'info',
  anual: 'info',
}

type Period = 'mes' | '30d' | 'tudo'

const periodLabels: Record<Period, string> = {
  mes: 'Este mês',
  '30d': 'Últimos 30 dias',
  tudo: 'Todo o período',
}

function periodStart(period: Period): Date {
  const now = new Date()
  if (period === 'mes') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1)
    return d
  }
  if (period === '30d') {
    return new Date(now.getTime() - 30 * 86400000)
  }
  return new Date(0)
}

export function Financeiro() {
  const [sales, setSales] = useState<Sale[]>([])
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [period, setPeriod] = useState<Period>('mes')

  const reload = () => {
    Promise.all([getSales(), getSaleItems(), getExpenses()]).then(([s, si, ex]) => {
      setSales(s)
      setSaleItems(si)
      setExpenses(ex)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  const removeExpense = async (expense: Expense) => {
    if (!confirm(`Excluir a despesa "${expense.description}"? Essa ação não pode ser desfeita.`)) return
    await deleteExpense(expense.id, expense.description)
    reload()
  }

  const expensesByResponsible = useMemo(() => {
    const totals = new Map<string, number>()
    for (const e of expenses) {
      const key = e.paid_by || 'Não informado'
      totals.set(key, (totals.get(key) ?? 0) + e.amount_brl)
    }
    return Array.from(totals.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
  }, [expenses])

  const start = useMemo(() => periodStart(period), [period])
  const periodSales = useMemo(
    () => sales.filter((s) => s.status !== 'cancelado' && new Date(s.sale_date) >= start),
    [sales, start],
  )
  const periodExpenses = useMemo(() => expenses.filter((e) => new Date(e.expense_date) >= start), [expenses, start])

  // ---------------------------------------------------------------------
  // DRE (Demonstração do Resultado do Exercício) — regime de competência,
  // simplificada: sem linha de impostos sobre o lucro (IR/CSLL), pois o
  // sistema ainda não tem esse dado. Despesas de importação/frete entram
  // como despesa operacional (não alocadas ao CMV por SKU).
  // ---------------------------------------------------------------------
  const dre = useMemo(() => {
    const grossRevenue = periodSales.reduce((sum, s) => {
      const items = saleItems.filter((i) => i.sale_id === s.id)
      return sum + items.reduce((t, i) => t + i.quantity * i.unit_price_brl, 0) + s.shipping_cost_brl
    }, 0)
    const discounts = periodSales.reduce((sum, s) => sum + s.discount_brl, 0)
    const netRevenue = grossRevenue - discounts
    const cogs = periodSales.reduce((sum, s) => {
      const items = saleItems.filter((i) => i.sale_id === s.id)
      return sum + items.reduce((t, i) => t + i.quantity * i.unit_cost_brl, 0)
    }, 0)
    const grossProfit = netRevenue - cogs

    const expensesByCategory = new Map<ExpenseCategory, number>()
    for (const e of periodExpenses) expensesByCategory.set(e.category, (expensesByCategory.get(e.category) ?? 0) + e.amount_brl)
    const totalOperatingExpenses = periodExpenses.reduce((sum, e) => sum + e.amount_brl, 0)

    const operatingResult = grossProfit - totalOperatingExpenses

    return {
      grossRevenue,
      discounts,
      netRevenue,
      cogs,
      grossProfit,
      grossMarginPct: netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0,
      expensesByCategory,
      totalOperatingExpenses,
      operatingResult,
      netMarginPct: netRevenue > 0 ? (operatingResult / netRevenue) * 100 : 0,
    }
  }, [periodSales, periodExpenses, saleItems])

  // ---------------------------------------------------------------------
  // Fluxo de caixa — regime de caixa: entradas = vendas com pagamento
  // confirmado (pago/enviado/entregue), por mês de competência da venda;
  // saidas = despesas, por mes da despesa. Saldo acumulado ao longo do
  // tempo (considera todo o historico, independente do filtro de periodo
  // acima, para mostrar a tendencia real do caixa).
  // ---------------------------------------------------------------------
  const cashFlow = useMemo(() => {
    const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const monthLabel = (d: Date) => d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })

    const months: { key: string; label: string; inflow: number; outflow: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ key: monthKey(d), label: monthLabel(d), inflow: 0, outflow: 0 })
    }

    const receivedStatuses = new Set(['pago', 'enviado', 'entregue'])
    for (const s of sales) {
      if (!receivedStatuses.has(s.status)) continue
      const key = monthKey(new Date(s.sale_date))
      const bucket = months.find((m) => m.key === key)
      if (!bucket) continue
      const items = saleItems.filter((i) => i.sale_id === s.id)
      bucket.inflow += items.reduce((t, i) => t + i.quantity * i.unit_price_brl, 0) - s.discount_brl + s.shipping_cost_brl
    }
    for (const e of expenses) {
      const key = monthKey(new Date(e.expense_date))
      const bucket = months.find((m) => m.key === key)
      if (!bucket) continue
      bucket.outflow += e.amount_brl
    }

    // saldo acumulado considerando TODO o historico (nao so os 6 meses
    // exibidos), para o numero de "caixa atual" ser real.
    const allTimeInflow = sales
      .filter((s) => receivedStatuses.has(s.status))
      .reduce((sum, s) => {
        const items = saleItems.filter((i) => i.sale_id === s.id)
        return sum + items.reduce((t, i) => t + i.quantity * i.unit_price_brl, 0) - s.discount_brl + s.shipping_cost_brl
      }, 0)
    const allTimeOutflow = expenses.reduce((sum, e) => sum + e.amount_brl, 0)
    const currentBalance = allTimeInflow - allTimeOutflow

    // saldo acumulado ponto-a-ponto dos ULTIMOS 6 meses exibidos, partindo
    // do saldo que já existia antes do primeiro mês do grafico.
    const balanceBeforeChart = currentBalance - months.reduce((t, m) => t + (m.inflow - m.outflow), 0)
    let running = balanceBeforeChart
    const series = months.map((m) => {
      running += m.inflow - m.outflow
      return { ...m, balance: running }
    })

    const thisMonthKey = monthKey(now)
    const thisMonth = months.find((m) => m.key === thisMonthKey)

    return {
      series,
      currentBalance,
      monthInflow: thisMonth?.inflow ?? 0,
      monthOutflow: thisMonth?.outflow ?? 0,
    }
  }, [sales, saleItems, expenses])

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Carregando...</div>

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Fluxo de caixa, DRE e despesas"
        action={<Button onClick={() => setShowForm((v) => !v)}>+ Despesa</Button>}
      />

      {showForm && (
        <ExpenseForm
          onDone={() => {
            setShowForm(false)
            reload()
          }}
        />
      )}

      {/* FLUXO DE CAIXA */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Fluxo de caixa
        </h2>
      </div>
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Saldo de caixa atual"
          value={formatBRL(cashFlow.currentBalance)}
          status={cashFlow.currentBalance >= 0 ? 'good' : 'critical'}
        />
        <StatTile label="Entradas do mês" value={formatBRL(cashFlow.monthInflow)} />
        <StatTile label="Saídas do mês" value={formatBRL(cashFlow.monthOutflow)} />
      </div>

      <Card className="mb-6">
        <h3 className="mb-1 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Entradas x saídas — últimos 6 meses
        </h3>
        <p className="mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          Barras: entradas (recebido) e saídas (pago). Linha: saldo acumulado de caixa.
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={cashFlow.series} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid stroke="var(--gridline)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--baseline)' }} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
              width={52}
              tickFormatter={(v) => `R$${Math.round(v / 100) / 10}k`}
            />
            <Tooltip
              formatter={(v, name) => [
                formatBRL(Number(v)),
                name === 'inflow' ? 'Entradas' : name === 'outflow' ? 'Saídas' : 'Saldo acumulado',
              ]}
              contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border-hairline)', borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="inflow" fill="var(--status-good)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="outflow" fill="var(--status-critical)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Line type="monotone" dataKey="balance" stroke="var(--series-1)" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* DRE */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          DRE — Demonstração do Resultado
        </h2>
        <div className="flex gap-1 rounded-lg border p-0.5" style={{ borderColor: 'var(--border-hairline)' }}>
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="rounded-md px-3 py-1 text-xs font-medium transition"
              style={{
                background: period === p ? 'var(--series-1)' : 'transparent',
                color: period === p ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <table className="w-full text-sm">
            <tbody>
              <DreRow label="Receita bruta de vendas" value={dre.grossRevenue} />
              <DreRow label="(–) Descontos concedidos" value={-dre.discounts} indent />
              <DreRow label="(=) Receita líquida" value={dre.netRevenue} bold />
              <DreRow label="(–) CMV (custo da mercadoria vendida)" value={-dre.cogs} indent />
              <DreRow
                label="(=) Lucro bruto"
                value={dre.grossProfit}
                bold
                sub={`margem bruta ${dre.grossMarginPct.toFixed(1)}%`}
              />
              {Array.from(dre.expensesByCategory.entries()).map(([cat, amount]) => (
                <DreRow key={cat} label={`(–) ${categoryLabels[cat]}`} value={-amount} indent muted />
              ))}
              <DreRow label="(–) Total despesas operacionais" value={-dre.totalOperatingExpenses} indent />
              <DreRow
                label="(=) Resultado operacional (líquido do período)"
                value={dre.operatingResult}
                bold
                status={dre.operatingResult >= 0 ? 'good' : 'critical'}
                sub={`margem líquida ${dre.netMarginPct.toFixed(1)}%`}
              />
            </tbody>
          </table>
          <p className="mt-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Regime de competência (considera a data da venda/despesa, não a data do recebimento/pagamento). Não inclui
            impostos sobre o lucro (IR/CSLL) — consulte seu contador para o resultado após impostos.
          </p>
        </Card>

        <Card className="overflow-x-auto">
          <h2 className="mb-4 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Últimas despesas
          </h2>
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left" style={{ color: 'var(--text-muted)' }}>
                <th className="pb-2 pr-3 font-medium">Data</th>
                <th className="pb-2 pr-3 font-medium">Categoria</th>
                <th className="pb-2 pr-3 font-medium">Descrição</th>
                <th className="pb-2 pr-3 font-medium">Responsável</th>
                <th className="pb-2 pr-3 font-medium">Recorrência</th>
                <th className="pb-2 pr-3 font-medium">Valor</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-t" style={{ borderColor: 'var(--gridline)' }}>
                  <td className="py-2 pr-3 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(e.expense_date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {categoryLabels[e.category]}
                  </td>
                  <td className="py-2 pr-3" style={{ color: 'var(--text-primary)' }}>
                    {e.description}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {e.paid_by || '—'}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    <Badge tone={recurrenceTone[e.recurrence]}>{recurrenceLabels[e.recurrence]}</Badge>
                  </td>
                  <td className="tabular py-2 pr-3 font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                    {formatBRL(e.amount_brl)}
                  </td>
                  <td className="py-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => removeExpense(e)}
                      className="text-xs"
                      style={{ color: 'var(--status-critical)' }}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="mb-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Gastos por responsável
        </h2>
        <p className="mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          Total pago por cada sócio, considerando todo o histórico de despesas.
        </p>
        {expensesByResponsible.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Nenhuma despesa registrada ainda.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={expensesByResponsible} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid stroke="var(--gridline)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--baseline)' }} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                width={52}
                tickFormatter={(v) => `R$${Math.round(v / 100) / 10}k`}
              />
              <Tooltip
                formatter={(v) => [formatBRL(Number(v)), 'Total pago']}
                contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border-hairline)', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="total" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={64} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  )
}

function DreRow({
  label,
  value,
  bold,
  indent,
  muted,
  sub,
  status,
}: {
  label: string
  value: number
  bold?: boolean
  indent?: boolean
  muted?: boolean
  sub?: string
  status?: 'good' | 'critical'
}) {
  const color = status === 'good' ? 'var(--status-good)' : status === 'critical' ? 'var(--status-critical)' : muted ? 'var(--text-muted)' : 'var(--text-primary)'
  return (
    <tr className="border-t" style={{ borderColor: 'var(--gridline)' }}>
      <td className={`py-2 ${indent ? 'pl-4' : ''}`} style={{ color: bold ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: bold ? 600 : 400 }}>
        {label}
        {sub && (
          <div className="text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>
            {sub}
          </div>
        )}
      </td>
      <td className="tabular py-2 text-right" style={{ color, fontWeight: bold ? 600 : 400 }}>
        {formatBRL(value)}
      </td>
    </tr>
  )
}

function ExpenseForm({ onDone }: { onDone: () => void }) {
  const [category, setCategory] = useState<ExpenseCategory>('operacional')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [paidBy, setPaidBy] = useState('')
  const [recurrence, setRecurrence] = useState<ExpenseRecurrence>('pontual')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await addExpense({
      expense_date: date,
      category,
      description,
      amount_brl: Number(amount),
      container_id: null,
      paid_by: paidBy || null,
      recurrence,
    })
    onDone()
  }

  return (
    <Card className="mb-4">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Categoria
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
          >
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Descrição
          </label>
          <input
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Valor (R$)
          </label>
          <input
            type="number"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Data
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Responsável pelo pagamento
          </label>
          <input
            list="paid-by-options"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            placeholder="Davi, Rubens, Iwan..."
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
          />
          <datalist id="paid-by-options">
            {paidByOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Recorrência
          </label>
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as ExpenseRecurrence)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
          >
            {(Object.entries(recurrenceLabels) as [ExpenseRecurrence, string][]).map(([value, label]) => (
              <option key={value} value={value} style={{ background: 'var(--surface-1)', color: 'var(--text-primary)' }}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-full flex justify-end gap-2">
          <Button type="submit">Registrar despesa</Button>
        </div>
      </form>
    </Card>
  )
}
