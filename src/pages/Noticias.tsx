import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Pin, PinOff, Plus } from 'lucide-react'
import {
  addManualPartnerNews,
  addPartnerNewsComment,
  getMarketRates,
  getPartnerNews,
  togglePartnerNewsCritical,
} from '@/lib/api'
import { Badge, Button, Card, PageHeader } from '@/components/ui'
import type { MarketRates, PartnerNews } from '@/types/domain'

const MARKET_REFRESH_MS = 60_000
const ALL_TOPICS = ['China', 'Tarifas', 'Eleição', 'Câmbio', 'Logística'] as const

function authorName(email: string): string {
  const local = email.split('@')[0] || email
  return local.charAt(0).toUpperCase() + local.slice(1)
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function RateTile({ label, value, suffix }: { label: string; value: number | null; suffix?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="tabular text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
        {value != null ? `${suffix ?? ''}${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
      </span>
    </div>
  )
}

function NewsCard({ news, onToggleCritical, onComment }: { news: PartnerNews; onToggleCritical: (n: PartnerNews) => void; onComment: (newsId: string, body: string) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async () => {
    const body = draft.trim()
    if (!body) return
    setSending(true)
    try {
      await onComment(news.id, body)
      setDraft('')
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a
            href={news.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-start gap-1.5 text-sm font-semibold hover:underline"
            style={{ color: 'var(--text-primary)' }}
          >
            {news.title}
            <ExternalLink size={13} className="mt-0.5 shrink-0" />
          </a>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {news.source && <span>{news.source}</span>}
            <span>{formatDate(news.published_at ?? news.created_at)}</span>
            {news.added_by && <span>· adicionado por {authorName(news.added_by)}</span>}
          </div>
          {news.summary && (
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {news.summary}
            </p>
          )}
          {news.is_critical && news.critical_reason && (
            <p className="mt-2 text-xs font-medium" style={{ color: 'var(--status-critical)' }}>
              Por que é crítico: {news.critical_reason}
            </p>
          )}
          {news.topics.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {news.topics.map((t) => (
                <Badge key={t} tone="info">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onToggleCritical(news)}
          title={news.is_critical ? 'Remover da sala de guerra' : 'Marcar como crítica (sala de guerra)'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
          style={{
            borderColor: news.is_critical ? 'var(--status-critical)' : 'var(--border-hairline)',
            color: news.is_critical ? 'var(--status-critical)' : 'var(--text-muted)',
          }}
        >
          {news.is_critical ? <Pin size={14} /> : <PinOff size={14} />}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-3 text-xs font-medium"
        style={{ color: 'var(--series-1)' }}
      >
        {open ? 'Ocultar insights' : `Ver insights${news.comments && news.comments.length > 0 ? ` (${news.comments.length})` : ''}`}
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3 border-t pt-3" style={{ borderColor: 'var(--gridline)' }}>
          {(news.comments ?? []).length === 0 && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Nenhum insight registrado ainda.
            </p>
          )}
          {(news.comments ?? []).map((c) => (
            <div key={c.id} className="text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {authorName(c.author_email)}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatDate(c.created_at)}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>{c.body}</p>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Registrar um insight..."
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
            <Button variant="secondary" onClick={submit} disabled={sending || !draft.trim()}>
              {sending ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

export function Noticias() {
  const [news, setNews] = useState<PartnerNews[]>([])
  const [loading, setLoading] = useState(true)
  const [topicFilter, setTopicFilter] = useState<string | 'todas'>('todas')
  const [rates, setRates] = useState<MarketRates | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', url: '', source: '', summary: '' })

  const reload = () => {
    getPartnerNews()
      .then((n) => {
        setNews(n)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(reload, [])

  useEffect(() => {
    const loadRates = () => getMarketRates().then(setRates).catch(() => {})
    loadRates()
    const interval = setInterval(loadRates, MARKET_REFRESH_MS)
    return () => clearInterval(interval)
  }, [])

  const critical = useMemo(() => news.filter((n) => n.is_critical), [news])
  const filteredFeed = useMemo(() => {
    const rest = news.filter((n) => !n.is_critical)
    if (topicFilter === 'todas') return rest
    return rest.filter((n) => n.topics.includes(topicFilter))
  }, [news, topicFilter])

  const handleToggleCritical = async (n: PartnerNews) => {
    setNews((prev) => prev.map((item) => (item.id === n.id ? { ...item, is_critical: !item.is_critical } : item)))
    try {
      await togglePartnerNewsCritical(n.id, !n.is_critical)
    } catch {
      reload()
    }
  }

  const handleComment = async (newsId: string, body: string) => {
    await addPartnerNewsComment(newsId, body)
    reload()
  }

  const handleAdd = async () => {
    if (!form.title.trim() || !form.url.trim()) {
      setAddError('Preencha pelo menos título e link.')
      return
    }
    setAdding(true)
    setAddError(null)
    try {
      await addManualPartnerNews({
        title: form.title.trim(),
        url: form.url.trim(),
        source: form.source.trim() || undefined,
        summary: form.summary.trim() || undefined,
        topics: [],
      })
      setForm({ title: '', url: '', source: '', summary: '' })
      setShowAddForm(false)
      reload()
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Não foi possível adicionar essa notícia (o link já pode estar cadastrado).')
    } finally {
      setAdding(false)
    }
  }

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Carregando...</div>

  return (
    <div>
      <PageHeader
        title="Notícias para os sócios"
        description="Comércio exterior, importação/exportação e o espaço pra registrar insights"
        action={
          <Button onClick={() => setShowAddForm((v) => !v)}>
            <span className="inline-flex items-center gap-1.5">
              <Plus size={14} />
              Adicionar link
            </span>
          </Button>
        }
      />

      {/* Cotações — atualiza sozinho a cada 1 min (o valor em si só muda a
          cada 15 min, gravado pela function refresh-market-rates). */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-6">
            <RateTile label="Dólar (USD/BRL)" value={rates?.usd_brl ?? null} suffix="R$ " />
            <RateTile label="Yuan (CNY/BRL)" value={rates?.cny_brl ?? null} suffix="R$ " />
            <RateTile label="Petróleo Brent" value={rates?.brent_usd ?? null} suffix="US$ " />
          </div>
          {rates?.updated_at && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Atualizado às {new Date(rates.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </Card>

      {showAddForm && (
        <Card className="mb-4">
          <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Adicionar notícia manualmente
          </h2>
          <div className="flex flex-col gap-2">
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Título"
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
            />
            <input
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="Link (https://...)"
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
            />
            <input
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              placeholder="Fonte (opcional)"
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
            />
            <textarea
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              placeholder="Resumo (opcional)"
              rows={2}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
            />
            {addError && (
              <div className="text-xs" style={{ color: 'var(--status-critical)' }}>
                {addError}
              </div>
            )}
            <div>
              <Button onClick={handleAdd} disabled={adding}>
                {adding ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {critical.length > 0 && (
        <div className="mb-4">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--status-critical)' }}>
            <Pin size={14} />
            Sala de guerra — crítico
          </h2>
          <div className="flex flex-col gap-3">
            {critical.map((n) => (
              <NewsCard key={n.id} news={n} onToggleCritical={handleToggleCritical} onComment={handleComment} />
            ))}
          </div>
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTopicFilter('todas')}
          className="rounded-full px-3 py-1 text-xs font-medium"
          style={{
            background: topicFilter === 'todas' ? 'var(--series-1)' : 'var(--surface-1)',
            color: topicFilter === 'todas' ? '#fff' : 'var(--text-secondary)',
            border: '1px solid var(--border-hairline)',
          }}
        >
          Todas
        </button>
        {ALL_TOPICS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTopicFilter(t)}
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{
              background: topicFilter === t ? 'var(--series-1)' : 'var(--surface-1)',
              color: topicFilter === t ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-hairline)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filteredFeed.length === 0 ? (
          <Card>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Nenhuma notícia encontrada ainda.
            </p>
          </Card>
        ) : (
          filteredFeed.map((n) => (
            <NewsCard key={n.id} news={n} onToggleCritical={handleToggleCritical} onComment={handleComment} />
          ))
        )}
      </div>
    </div>
  )
}
