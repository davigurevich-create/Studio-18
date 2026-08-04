import { useEffect, useMemo, useState } from 'react'
import { getAuditLog } from '@/lib/api'
import { Badge, Card, PageHeader } from '@/components/ui'
import type { AuditAction, AuditLogEntry } from '@/types/domain'

const actionTone: Record<AuditAction, 'muted' | 'good' | 'warning' | 'critical' | 'info'> = {
  criar: 'good',
  editar: 'info',
  excluir: 'critical',
}

const entityLabels: Record<string, string> = {
  produto: 'Produto',
  container: 'Container',
  movimentacao: 'Movimentação',
  venda: 'Venda',
  despesa: 'Despesa',
  post_blog: 'Post do blog',
  solicitacao_peca: 'Solicitação de peça',
}

export function AuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<'todas' | AuditAction>('todas')
  const [entityFilter, setEntityFilter] = useState('todas')
  const [actorFilter, setActorFilter] = useState('todos')

  useEffect(() => {
    getAuditLog().then((e) => {
      setEntries(e)
      setLoading(false)
    })
  }, [])

  const entities = useMemo(() => {
    const present = new Set(entries.map((e) => e.entity))
    return ['todas', ...Array.from(present).sort()]
  }, [entries])

  const actors = useMemo(() => {
    const present = new Set(entries.map((e) => e.actor_email))
    return ['todos', ...Array.from(present).sort()]
  }, [entries])

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries.filter((e) => {
      if (actionFilter !== 'todas' && e.action !== actionFilter) return false
      if (entityFilter !== 'todas' && e.entity !== entityFilter) return false
      if (actorFilter !== 'todos' && e.actor_email !== actorFilter) return false
      if (q && !e.summary.toLowerCase().includes(q) && !e.actor_email.toLowerCase().includes(q)) return false
      return true
    })
  }, [entries, search, actionFilter, entityFilter, actorFilter])

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Carregando...</div>

  return (
    <div>
      <PageHeader
        title="Log de auditoria"
        description="Histórico de criações, edições e exclusões feitas por qualquer administrador do painel"
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por descrição ou usuário..."
          className="w-full rounded-lg border px-3 py-2 text-sm sm:w-80"
          style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
        />
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value as typeof actionFilter)}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
        >
          <option value="todas">Todas as ações</option>
          <option value="criar">Criar</option>
          <option value="editar">Editar</option>
          <option value="excluir">Excluir</option>
        </select>
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
        >
          {entities.map((e) => (
            <option key={e} value={e}>
              {e === 'todas' ? 'Todas as áreas' : entityLabels[e] ?? e}
            </option>
          ))}
        </select>
        <select
          value={actorFilter}
          onChange={(e) => setActorFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
        >
          {actors.map((a) => (
            <option key={a} value={a}>
              {a === 'todos' ? 'Todos os usuários' : a}
            </option>
          ))}
        </select>
        {(search || actionFilter !== 'todas' || entityFilter !== 'todas' || actorFilter !== 'todos') && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {filteredEntries.length} de {entries.length} registros
          </span>
        )}
      </div>

      <Card className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left" style={{ color: 'var(--text-muted)' }}>
              <th className="pb-2 font-medium">Quando</th>
              <th className="pb-2 font-medium">Usuário</th>
              <th className="pb-2 font-medium">Ação</th>
              <th className="pb-2 font-medium">Área</th>
              <th className="pb-2 font-medium">O que mudou</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Nenhum registro encontrado com esses filtros.
                </td>
              </tr>
            ) : (
              filteredEntries.map((e) => (
                <tr key={e.id} className="border-t align-top" style={{ borderColor: 'var(--gridline)' }}>
                  <td className="whitespace-nowrap py-2.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(e.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td className="py-2.5" style={{ color: 'var(--text-primary)' }}>
                    {e.actor_email}
                  </td>
                  <td className="py-2.5">
                    <Badge tone={actionTone[e.action]}>{e.action}</Badge>
                  </td>
                  <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {entityLabels[e.entity] ?? e.entity}
                  </td>
                  <td className="py-2.5" style={{ color: 'var(--text-primary)' }}>
                    {e.summary}
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
