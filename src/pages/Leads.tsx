import { useEffect, useMemo, useState } from 'react'
import { getLeads } from '@/lib/api'
import { Badge, Button, Card, PageHeader } from '@/components/ui'
import type { Lead } from '@/types/domain'

const SOURCE_LABELS: Record<string, string> = {
  popup_boas_vindas: 'Pop-up de boas-vindas',
}

function sourceLabel(source: string) {
  return SOURCE_LABELS[source] ?? source
}

export function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'todas' | string>('todas')
  const [copiedAll, setCopiedAll] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    getLeads().then((l) => {
      setLeads(l)
      setLoading(false)
    })
  }, [])

  const bySource = useMemo(() => {
    const counts = new Map<string, number>()
    for (const l of leads) {
      counts.set(l.source, (counts.get(l.source) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
  }, [leads])

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leads.filter((l) => {
      if (sourceFilter !== 'todas' && l.source !== sourceFilter) return false
      if (!q) return true
      return l.email.toLowerCase().includes(q)
    })
  }, [leads, search, sourceFilter])

  const copyAll = () => {
    const emails = filteredLeads.map((l) => l.email).join('\n')
    navigator.clipboard.writeText(emails)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  const copyOne = (lead: Lead) => {
    navigator.clipboard.writeText(lead.email)
    setCopiedId(lead.id)
    setTimeout(() => setCopiedId((current) => (current === lead.id ? null : current)), 1800)
  }

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Carregando...</div>

  return (
    <div>
      <PageHeader
        title="Leads"
        description="E-mails coletados pelo pop-up de boas-vindas do site"
        action={
          <Button onClick={copyAll} disabled={filteredLeads.length === 0}>
            {copiedAll ? '✓ Copiado!' : `Copiar todos os e-mails (${filteredLeads.length})`}
          </Button>
        }
      />

      {bySource.length > 0 && (
        <Card className="mt-4">
          <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Origem dos leads
          </h2>
          <div className="flex flex-col gap-2">
            {bySource.map(({ source, count }) => (
              <div key={source} className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-primary)' }}>{sourceLabel(source)}</span>
                <Badge tone="warning">
                  {count} {count === 1 ? 'e-mail' : 'e-mails'} ({Math.round((count / leads.length) * 100)}%)
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="mb-4 mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por e-mail..."
          className="w-full rounded-lg border px-3 py-2 text-sm sm:w-80"
          style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
        />
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
        >
          <option value="todas">Todas as origens</option>
          {bySource.map(({ source }) => (
            <option key={source} value={source}>
              {sourceLabel(source)}
            </option>
          ))}
        </select>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {filteredLeads.length} de {leads.length} {leads.length === 1 ? 'e-mail coletado' : 'e-mails coletados'}
        </span>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left" style={{ color: 'var(--text-muted)' }}>
              <th className="pb-2 font-medium">Data</th>
              <th className="pb-2 font-medium">E-mail</th>
              <th className="pb-2 font-medium">Origem</th>
              <th className="pb-2 font-medium">Ação</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Nenhum e-mail encontrado.
                </td>
              </tr>
            ) : (
              filteredLeads.map((l) => (
                <tr key={l.id} className="border-t align-top" style={{ borderColor: 'var(--gridline)' }}>
                  <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(l.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {l.email}
                  </td>
                  <td className="py-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {sourceLabel(l.source)}
                  </td>
                  <td className="py-2.5">
                    <button
                      onClick={() => copyOne(l)}
                      className="rounded-md border px-2.5 py-1 text-xs font-medium"
                      style={{
                        borderColor: 'var(--border-hairline)',
                        color: copiedId === l.id ? 'var(--status-good)' : 'var(--text-secondary)',
                      }}
                    >
                      {copiedId === l.id ? '✓ Copiado!' : 'Copiar'}
                    </button>
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
