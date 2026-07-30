import { useEffect, useMemo, useState } from 'react'
import { getPartRequests, updatePartRequestNotes, updatePartRequestStatus } from '@/lib/api'
import { Badge, Card, PageHeader } from '@/components/ui'
import type { PartRequest, PartRequestStatus, ReplacementType } from '@/types/domain'

const statusTone: Record<PartRequestStatus, 'muted' | 'good' | 'warning' | 'critical' | 'info'> = {
  pendente: 'warning',
  em_producao: 'info',
  enviado: 'info',
  concluido: 'good',
}

const replacementLabel: Record<ReplacementType, string> = {
  impressao_3d: 'Impressão 3D (até 2 dias úteis)',
  original_fabricante: 'Peça original do fabricante',
}

export function PecasFaltantes() {
  const [requests, setRequests] = useState<PartRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | PartRequestStatus>('todos')

  const reload = () => {
    getPartRequests().then((r) => {
      setRequests(r)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  const changeStatus = async (id: string, status: PartRequestStatus, previousStatus: PartRequestStatus) => {
    await updatePartRequestStatus(id, status, previousStatus)
    reload()
  }

  const saveNotes = async (id: string, notes: string) => {
    await updatePartRequestNotes(id, notes)
    reload()
  }

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase()
    return requests.filter((r) => {
      if (statusFilter !== 'todos' && r.status !== statusFilter) return false
      if (q) {
        const haystack = `${r.customer_name} ${r.customer_email} ${r.order_reference} ${r.product_model} ${r.part_description}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [requests, search, statusFilter])

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Carregando...</div>

  const pendingCount = requests.filter((r) => r.status === 'pendente').length

  return (
    <div>
      <PageHeader
        title="Peças faltantes"
        description="Solicitações de reposição enviadas pelo site — impressão 3D provisória ou peça original do fabricante, sempre gratuito para o cliente"
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente, pedido, modelo ou peça..."
          className="w-full rounded-lg border px-3 py-2 text-sm sm:w-80"
          style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
        >
          <option value="todos">Todos os status</option>
          {(['pendente', 'em_producao', 'enviado', 'concluido'] as PartRequestStatus[]).map((st) => (
            <option key={st} value={st}>
              {st.replace('_', ' ')}
            </option>
          ))}
        </select>
        {(search || statusFilter !== 'todos') && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {filteredRequests.length} de {requests.length} solicitações
          </span>
        )}
        {pendingCount > 0 && (
          <span className="text-xs" style={{ color: 'var(--status-warning)' }}>
            {pendingCount} pendente{pendingCount > 1 ? 's' : ''} de resposta
          </span>
        )}
      </div>

      <Card className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ color: 'var(--text-muted)' }}>
              <th className="pb-2 font-medium">Data</th>
              <th className="pb-2 font-medium">Cliente</th>
              <th className="pb-2 font-medium">Pedido</th>
              <th className="pb-2 font-medium">Peça</th>
              <th className="pb-2 font-medium">Foto</th>
              <th className="pb-2 font-medium">Tipo de reposição</th>
              <th className="pb-2 font-medium">Notas internas</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Nenhuma solicitação encontrada com esses filtros.
                </td>
              </tr>
            ) : (
              filteredRequests.map((r) => (
                <tr key={r.id} className="border-t align-top" style={{ borderColor: 'var(--gridline)' }}>
                  <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(r.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-2.5" style={{ color: 'var(--text-primary)' }}>
                    <div className="font-medium">{r.customer_name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {r.customer_email}
                    </div>
                  </td>
                  <td className="py-2.5 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {r.order_reference}
                  </td>
                  <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {r.product_model}
                    </div>
                    <div className="text-xs">{r.part_description}</div>
                  </td>
                  <td className="py-2.5">
                    {r.photo_url ? (
                      <a href={r.photo_url} target="_blank" rel="noreferrer">
                        <img
                          src={r.photo_url}
                          alt={`Foto da peça — ${r.product_model}`}
                          className="h-12 w-12 rounded-md object-cover"
                          style={{ border: '1px solid var(--border-hairline)' }}
                        />
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td className="py-2.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {replacementLabel[r.replacement_type]}
                  </td>
                  <td className="py-2.5">
                    <NotesField initialValue={r.admin_notes ?? ''} onSave={(notes) => saveNotes(r.id, notes)} />
                  </td>
                  <td className="py-2.5">
                    <select
                      value={r.status}
                      onChange={(e) => changeStatus(r.id, e.target.value as PartRequestStatus, r.status)}
                      className="rounded-md border-0 bg-transparent text-xs"
                      style={{ color: 'inherit' }}
                    >
                      {(['pendente', 'em_producao', 'enviado', 'concluido'] as PartRequestStatus[]).map((st) => (
                        <option key={st} value={st} style={{ background: 'var(--surface-1)', color: 'var(--text-primary)' }}>
                          {st.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                    <div className="mt-1">
                      <Badge tone={statusTone[r.status]}>{r.status.replace('_', ' ')}</Badge>
                    </div>
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

function NotesField({ initialValue, onSave }: { initialValue: string; onSave: (value: string) => void }) {
  const [value, setValue] = useState(initialValue)

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== initialValue) onSave(value)
      }}
      placeholder="Adicionar nota..."
      className="w-40 rounded-md border-0 bg-transparent text-xs outline-none"
      style={{ color: 'var(--text-secondary)' }}
    />
  )
}
