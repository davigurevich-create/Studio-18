import { useEffect, useMemo, useState } from 'react'
import { getPointsLedger, markPointsIssued } from '@/lib/api'
import { Badge, Card, PageHeader } from '@/components/ui'
import type { PointsLedgerEntry } from '@/types/domain'

export function Pontos() {
  const [entries, setEntries] = useState<PointsLedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'emitido'>('pendente')
  const [savingId, setSavingId] = useState<string | null>(null)

  const reload = () => {
    getPointsLedger().then((e) => {
      setEntries(e)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  const markIssued = async (id: string) => {
    setSavingId(id)
    await markPointsIssued(id)
    setSavingId(null)
    reload()
  }

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries.filter((e) => {
      if (statusFilter === 'pendente' && e.issued_at) return false
      if (statusFilter === 'emitido' && !e.issued_at) return false
      if (q && !e.customer_email.toLowerCase().includes(q)) return false
      return true
    })
  }, [entries, search, statusFilter])

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Carregando...</div>

  const pendingCount = entries.filter((e) => !e.issued_at).length

  return (
    <div>
      <PageHeader
        title="Pontos"
        description="Créditos de pontos ganhos pelos clientes (depoimentos, indicações...) — o selo com os pontos é emitido manualmente no portal BOB, marque aqui depois de emitir pra não duplicar"
      />

      <div className="mb-4 mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por e-mail..."
          className="w-full rounded-lg border px-3 py-2 text-sm sm:w-80"
          style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
        >
          <option value="pendente">Pendentes de emissão</option>
          <option value="emitido">Já emitidos</option>
          <option value="todos">Todos</option>
        </select>
        {pendingCount > 0 && (
          <span className="text-xs" style={{ color: 'var(--status-warning)' }}>
            {pendingCount} pendente{pendingCount > 1 ? 's' : ''} de emissão no BOB
          </span>
        )}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left" style={{ color: 'var(--text-muted)' }}>
              <th className="pb-2 font-medium">Data</th>
              <th className="pb-2 font-medium">Cliente</th>
              <th className="pb-2 font-medium">Pontos</th>
              <th className="pb-2 font-medium">Motivo</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Nenhum crédito de pontos encontrado.
                </td>
              </tr>
            ) : (
              filteredEntries.map((e) => (
                <tr key={e.id} className="border-t align-top" style={{ borderColor: 'var(--gridline)' }}>
                  <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(e.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {e.customer_email}
                  </td>
                  <td className="py-2.5 font-medium" style={{ color: 'var(--series-1)' }}>
                    {e.points}
                  </td>
                  <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {e.reason}
                  </td>
                  <td className="py-2.5">
                    {e.issued_at ? (
                      <Badge tone="good">Emitido no BOB</Badge>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markIssued(e.id)}
                        disabled={savingId === e.id}
                        className="rounded-md border px-2.5 py-1 text-xs font-medium disabled:opacity-50"
                        style={{ borderColor: 'var(--border-hairline)', color: 'var(--text-primary)' }}
                      >
                        {savingId === e.id ? 'Salvando...' : 'Marcar como emitido'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
