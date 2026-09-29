import { useEffect, useMemo, useState } from 'react'
import { getTestimonials, updateTestimonialMessage, updateTestimonialStatus } from '@/lib/api'
import { Badge, Card, PageHeader } from '@/components/ui'
import type { Testimonial, TestimonialStatus } from '@/types/domain'

const statusTone: Record<TestimonialStatus, 'muted' | 'good' | 'warning' | 'critical' | 'info'> = {
  pendente: 'warning',
  aprovado: 'good',
  rejeitado: 'critical',
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="tabular" style={{ color: 'var(--status-warning)' }}>
      {'★'.repeat(rating)}
      <span style={{ color: 'var(--gridline)' }}>{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

function MessageCell({ testimonial, onSaved }: { testimonial: Testimonial; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(testimonial.message)
  const [saving, setSaving] = useState(false)

  if (!editing) {
    return (
      <div className="flex flex-col gap-1">
        <p>{testimonial.message}</p>
        <button
          type="button"
          onClick={() => {
            setDraft(testimonial.message)
            setEditing(true)
          }}
          className="self-start text-xs font-medium"
          style={{ color: 'var(--series-1)' }}
        >
          Corrigir texto
        </button>
      </div>
    )
  }

  const save = async () => {
    setSaving(true)
    await updateTestimonialMessage(testimonial.id, draft.trim())
    setSaving(false)
    setEditing(false)
    onSaved()
  }

  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={4}
        className="w-full rounded-md border px-2 py-1.5 text-sm"
        style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving || !draft.trim()}
          className="rounded-md px-2.5 py-1 text-xs font-medium disabled:opacity-50"
          style={{ background: 'var(--series-1)', color: '#fff' }}
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={saving}
          className="text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

export function Depoimentos() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | TestimonialStatus>('todos')

  const reload = () => {
    getTestimonials().then((t) => {
      setTestimonials(t)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  const changeStatus = async (id: string, status: TestimonialStatus, previousStatus: TestimonialStatus) => {
    await updateTestimonialStatus(id, status, previousStatus)
    reload()
  }

  const filteredTestimonials = useMemo(() => {
    const q = search.trim().toLowerCase()
    return testimonials.filter((t) => {
      if (statusFilter !== 'todos' && t.status !== statusFilter) return false
      if (q) {
        const haystack = `${t.customer_name} ${t.customer_email} ${t.message}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [testimonials, search, statusFilter])

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Carregando...</div>

  const pendingCount = testimonials.filter((t) => t.status === 'pendente').length

  return (
    <div>
      <PageHeader
        title="Depoimentos"
        description="Avaliações enviadas pelos clientes 5 dias após a entrega — aprove pra publicar na home do site"
      />

      <div className="mb-4 mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente, e-mail ou texto..."
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
          {(['pendente', 'aprovado', 'rejeitado'] as TestimonialStatus[]).map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
        {pendingCount > 0 && (
          <span className="text-xs" style={{ color: 'var(--status-warning)' }}>
            {pendingCount} pendente{pendingCount > 1 ? 's' : ''} de revisão
          </span>
        )}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="text-left" style={{ color: 'var(--text-muted)' }}>
              <th className="pb-2 font-medium">Data</th>
              <th className="pb-2 font-medium">Cliente</th>
              <th className="pb-2 font-medium">Set</th>
              <th className="pb-2 font-medium">Nota</th>
              <th className="pb-2 font-medium">Depoimento</th>
              <th className="pb-2 font-medium">Foto</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTestimonials.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Nenhum depoimento encontrado.
                </td>
              </tr>
            ) : (
              filteredTestimonials.map((t) => (
                <tr key={t.id} className="border-t align-top" style={{ borderColor: 'var(--gridline)' }}>
                  <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(t.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-2.5" style={{ color: 'var(--text-primary)' }}>
                    <div className="font-medium">{t.customer_name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t.customer_email}
                    </div>
                  </td>
                  <td className="py-2.5 max-w-[160px]" style={{ color: 'var(--text-secondary)' }}>
                    {t.product_names?.join(', ') ?? '—'}
                  </td>
                  <td className="py-2.5">
                    <Stars rating={t.rating} />
                  </td>
                  <td className="py-2.5 max-w-[320px]" style={{ color: 'var(--text-secondary)' }}>
                    <MessageCell testimonial={t} onSaved={reload} />
                  </td>
                  <td className="py-2.5">
                    {t.photo_url ? (
                      <a href={t.photo_url} target="_blank" rel="noreferrer">
                        <img
                          src={t.photo_url}
                          alt={`Foto enviada por ${t.customer_name}`}
                          className="h-12 w-12 rounded-md object-cover"
                          style={{ border: '1px solid var(--border-hairline)' }}
                        />
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td className="py-2.5">
                    <select
                      value={t.status}
                      onChange={(e) => changeStatus(t.id, e.target.value as TestimonialStatus, t.status)}
                      className="rounded-md border-0 bg-transparent text-xs"
                      style={{ color: 'inherit' }}
                    >
                      {(['pendente', 'aprovado', 'rejeitado'] as TestimonialStatus[]).map((st) => (
                        <option key={st} value={st} style={{ background: 'var(--surface-1)', color: 'var(--text-primary)' }}>
                          {st}
                        </option>
                      ))}
                    </select>
                    <div className="mt-1">
                      <Badge tone={statusTone[t.status]}>{t.status}</Badge>
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
