import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { addExpense, getExpenses, getSaleItems, getSales } from '@/lib/api'
import { Button, Card, PageHeader, StatTile, formatBRL } from '@/components/ui'
import type { Expense, ExpenseCategory, Sale, SaleItem } from '@/types/domain'

const categoryLabels: Record<ExpenseCategory, string> = {
  importacao: 'Importação',
  marketing: 'Marketing',
  operacional: 'Operacional',
  frete: 'Frete',
  taxas: 'Taxas',
  outros: 'Outros',
}

export function Financeiro() {
  const [sales, setSales] = useState<Sale[]>([])
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const reload = () => {
    Promise.all([getSales(), getSaleItems(), getExpenses()]).then(([s, si, ex]) => {
      setSales(s)
      setSaleItems(si)
      setExpenses(ex)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  const totals = useMemo(() => {
    const revenue = sales
      .filter((s) => s.status !== 'cancelado')
      .reduce((sum, s) => {
        const items = saleItems.filter((i) => i.sale_id === s.id)
        return sum + items.reduce((t, i) => t + i.quantity * i.unit_price_brl, 0) - s.discount_brl + s.shipping_cost_brl
      }, 0)
    const cogs = sales
      .filter((s) => s.status !== 'cancelado')
      .reduce((sum, s) => {
        const items = saleItems.filter((i) => i.sale_id === s.id)
        return sum + items.reduce((t, i) => t + i.quantity * i.unit_cost_brl, 0)
      }, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount_brl, 0)
    const netResult = revenue - cogs - totalExpenses
    return { revenue, cogs, totalExpenses, netResult }
  }, [sales, saleItems, expenses])

  const byCategory = useMemo(() => {
    const map = new Map<ExpenseCategory, number>()
    for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount_brl)
    return Array.from(map.entries()).map(([category, amount]) => ({
      category: categoryLabels[category],
      amount,
    }))
  }, [expenses])

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Carregando...</div>

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Receita, custo de mercadoria vendida, despesas e resultado líquido"
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

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Receita total (histórico)" value={formatBRL(totals.revenue)} />
        <StatTile label="Custo da mercadoria (CMV)" value={formatBRL(totals.cogs)} />
        <StatTile label="Despesas totais" value={formatBRL(totals.totalExpenses)} />
        <StatTile
          label="Resultado líquido"
          value={formatBRL(totals.netResult)}
          status={totals.netResult >= 0 ? 'good' : 'critical'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Despesas por categoria
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byCategory} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 0 }}>
              <CartesianGrid stroke="var(--gridline)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={{ stroke: 'var(--baseline)' }}
                tickLine={false}
                width={90}
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
              <Bar dataKey="amount" fill="var(--series-5)" radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="overflow-x-auto">
          <h2 className="mb-4 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Últimas despesas
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ color: 'var(--text-muted)' }}>
                <th className="pb-2 pr-3 font-medium">Data</th>
                <th className="pb-2 pr-3 font-medium">Categoria</th>
                <th className="pb-2 pr-3 font-medium">Descrição</th>
                <th className="pb-2 font-medium">Valor</th>
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
                  <td className="tabular py-2 font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                    {formatBRL(e.amount_brl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}

function ExpenseForm({ onDone }: { onDone: () => void }) {
  const [category, setCategory] = useState<ExpenseCategory>('operacional')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await addExpense({
      expense_date: date,
      category,
      description,
      amount_brl: Number(amount),
      container_id: null,
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
        <div className="col-span-full flex justify-end gap-2">
          <Button type="submit">Registrar despesa</Button>
        </div>
      </form>
    </Card>
  )
}
