import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  createSocialContentIdea,
  deleteSocialContentIdea,
  getSocialContentIdeas,
  updateSocialContentIdeaStatus,
} from '@/lib/api'
import { Badge, Button, Card, PageHeader } from '@/components/ui'
import type { SocialContentIdea, SocialContentStatus, SocialPlatform } from '@/types/domain'

const pillarLabels: Record<string, string> = {
  bastidores: 'Bastidores & Prova de Qualidade',
  educacao: 'Educação & Curiosidades Automotivas',
  produto: 'Produto em Destaque',
  comunidade: 'Comunidade & Prova Social',
  oferta: 'Novidades & Estoque',
}

const statusColors: Record<SocialContentStatus, { bg: string; fg: string }> = {
  sugerido: { bg: 'rgba(137,135,129,0.15)', fg: 'var(--text-secondary)' },
  em_producao: { bg: 'rgba(250,178,25,0.16)', fg: '#8a5b00' },
  publicado: { bg: 'rgba(12,163,12,0.12)', fg: 'var(--status-good)' },
}

const statusLabels: Record<SocialContentStatus, string> = {
  sugerido: 'Sugerido',
  em_producao: 'Em produção',
  publicado: 'Publicado',
}

const weeklyCalendar: { day: string; pillar: string; note: string }[] = [
  {
    day: 'Segunda',
    pillar: 'Bastidores & Prova de Qualidade',
    note: 'Mostrar o processo real por trás da marca — monta-se, testa-se, garante-se antes de vender.',
  },
  {
    day: 'Quarta',
    pillar: 'Educação & Curiosidades Automotivas',
    note: 'Ensinar sobre o carro real por trás de cada set — gera autoridade e alcance orgânico.',
  },
  {
    day: 'Sexta',
    pillar: 'Produto em Destaque',
    note: 'Spotlight de um modelo específico — unboxing, ASMR, detalhes de montagem.',
  },
  {
    day: 'Sábado',
    pillar: 'Comunidade & Prova Social',
    note: 'Depoimentos, fotos e vídeos de clientes reais, enquetes e perguntas.',
  },
  {
    day: 'Domingo',
    pillar: 'Novidades & Estoque',
    note: 'Chegada de containers, estoque baixo, lançamentos e ofertas do lote atual.',
  },
]

export function SocialMedia() {
  const [ideas, setIdeas] = useState<SocialContentIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [platform, setPlatform] = useState<SocialPlatform>('instagram')
  const [pillarFilter, setPillarFilter] = useState('todos')
  const [showForm, setShowForm] = useState(false)

  const reload = () => {
    getSocialContentIdeas().then((r) => {
      setIdeas(r)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  const filteredIdeas = useMemo(() => {
    return ideas.filter((i) => {
      if (i.platform !== platform) return false
      if (pillarFilter !== 'todos' && i.pillar !== pillarFilter) return false
      return true
    })
  }, [ideas, platform, pillarFilter])

  const changeStatus = async (idea: SocialContentIdea, status: SocialContentStatus) => {
    await updateSocialContentIdeaStatus(idea.id, status, idea.title)
    reload()
  }

  const remove = async (idea: SocialContentIdea) => {
    if (!confirm(`Excluir a sugestão "${idea.title}"? Essa ação não pode ser desfeita.`)) return
    await deleteSocialContentIdea(idea.id, idea.title)
    reload()
  }

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Carregando...</div>

  const instagramCount = ideas.filter((i) => i.platform === 'instagram').length
  const tiktokCount = ideas.filter((i) => i.platform === 'tiktok').length

  return (
    <div>
      <PageHeader
        title="Social Media"
        description="Motor de conteúdo para Instagram e TikTok — calendário editorial e coletânea de sugestões de posts e vídeos"
        action={<Button onClick={() => setShowForm((v) => !v)}>+ Nova sugestão</Button>}
      />

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setPlatform('instagram')}
          className="rounded-lg px-4 py-2 text-sm font-medium transition"
          style={{
            background: platform === 'instagram' ? 'var(--series-1)' : 'var(--surface-1)',
            color: platform === 'instagram' ? '#fff' : 'var(--text-secondary)',
            border: '1px solid var(--border-hairline)',
          }}
        >
          Instagram ({instagramCount})
        </button>
        <button
          onClick={() => setPlatform('tiktok')}
          className="rounded-lg px-4 py-2 text-sm font-medium transition"
          style={{
            background: platform === 'tiktok' ? 'var(--series-1)' : 'var(--surface-1)',
            color: platform === 'tiktok' ? '#fff' : 'var(--text-secondary)',
            border: '1px solid var(--border-hairline)',
          }}
        >
          TikTok ({tiktokCount})
        </button>
      </div>

      <Card className="mb-4">
        <h2 className="mb-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Linha editorial semanal
        </h2>
        <p className="mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          {platform === 'instagram'
            ? 'Sugestão de cadência: 3 a 4 publicações por semana, alternando os pilares abaixo.'
            : 'Sugestão de cadência: pode ser diário — os mesmos pilares valem, em formato mais curto e direto ao ponto.'}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {weeklyCalendar.map((d) => (
            <div key={d.day} className="rounded-lg border p-3" style={{ borderColor: 'var(--border-hairline)' }}>
              <div className="text-xs font-semibold tracking-wide" style={{ color: 'var(--series-1)' }}>
                {d.day.toUpperCase()}
              </div>
              <div className="mt-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {d.pillar}
              </div>
              <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                {d.note}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showForm && (
        <IdeaForm
          platform={platform}
          onDone={() => {
            setShowForm(false)
            reload()
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={pillarFilter}
          onChange={(e) => setPillarFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
        >
          <option value="todos">Todos os pilares</option>
          {Object.entries(pillarLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {filteredIdeas.length} sugestõe{filteredIdeas.length === 1 ? '' : 's'}
        </span>
      </div>

      {filteredIdeas.length === 0 ? (
        <Card>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Nenhuma sugestão encontrada com esses filtros.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredIdeas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} onChangeStatus={changeStatus} onRemove={remove} />
          ))}
        </div>
      )}
    </div>
  )
}

function IdeaCard({
  idea,
  onChangeStatus,
  onRemove,
}: {
  idea: SocialContentIdea
  onChangeStatus: (idea: SocialContentIdea, status: SocialContentStatus) => void
  onRemove: (idea: SocialContentIdea) => void
}) {
  const [copied, setCopied] = useState(false)

  const copyPrompt = () => {
    if (!idea.visual_prompt) return
    navigator.clipboard.writeText(idea.visual_prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge tone="info">{idea.format}</Badge>
        <Badge tone="muted">{pillarLabels[idea.pillar] ?? idea.pillar}</Badge>
        <select
          value={idea.status}
          onChange={(e) => onChangeStatus(idea, e.target.value as SocialContentStatus)}
          className="ml-auto rounded-full border-0 px-2.5 py-0.5 text-xs font-medium"
          style={{ background: statusColors[idea.status].bg, color: statusColors[idea.status].fg }}
        >
          {(['sugerido', 'em_producao', 'publicado'] as SocialContentStatus[]).map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
      </div>

      <h3 className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        {idea.title}
      </h3>

      <p className="mb-2 whitespace-pre-line text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {idea.script}
      </p>

      {idea.hashtags && (
        <p className="mb-2 text-xs" style={{ color: 'var(--series-1)' }}>
          {idea.hashtags}
        </p>
      )}

      {idea.cta && (
        <p className="mb-3 text-xs italic" style={{ color: 'var(--text-muted)' }}>
          CTA: {idea.cta}
        </p>
      )}

      {idea.visual_prompt && (
        <div className="mb-3 rounded-lg border p-3" style={{ borderColor: 'var(--border-hairline)', background: 'var(--page-plane)' }}>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--text-muted)' }}>
              PROMPT PARA IA (imagem/vídeo)
            </span>
            <button
              type="button"
              onClick={copyPrompt}
              className="rounded-md px-2 py-1 text-[11px] font-medium"
              style={{
                background: copied ? 'var(--status-good)' : 'var(--surface-1)',
                color: copied ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-hairline)',
              }}
            >
              {copied ? '✓ Copiado!' : 'Copiar'}
            </button>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {idea.visual_prompt}
          </p>
        </div>
      )}

      <button onClick={() => onRemove(idea)} className="text-xs" style={{ color: 'var(--status-critical)' }}>
        Excluir
      </button>
    </Card>
  )
}

function IdeaForm({
  platform,
  onDone,
  onCancel,
}: {
  platform: SocialPlatform
  onDone: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    format: platform === 'instagram' ? 'reel' : 'video',
    pillar: 'bastidores',
    title: '',
    script: '',
    hashtags: '',
    cta: '',
    visual_prompt: '',
  })
  const [saving, setSaving] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createSocialContentIdea({
        platform,
        format: form.format,
        pillar: form.pillar,
        title: form.title,
        script: form.script,
        hashtags: form.hashtags || null,
        cta: form.cta || null,
        visual_prompt: form.visual_prompt || null,
        status: 'sugerido',
      })
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="mb-4">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Nova sugestão para {platform === 'instagram' ? 'Instagram' : 'TikTok'}
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Título" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Pilar de conteúdo
            </label>
            <select
              value={form.pillar}
              onChange={(e) => setForm({ ...form, pillar: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border-hairline)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
            >
              {Object.entries(pillarLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Field label="Formato (ex: reel, carrossel, stories, video)" value={form.format} onChange={(v) => setForm({ ...form, format: v })} required />
        <Field label="Roteiro / legenda" value={form.script} onChange={(v) => setForm({ ...form, script: v })} textarea rows={5} required />
        <Field label="Hashtags" value={form.hashtags} onChange={(v) => setForm({ ...form, hashtags: v })} placeholder="#studio18 #legotechnic ..." />
        <Field label="CTA (chamada para ação)" value={form.cta} onChange={(v) => setForm({ ...form, cta: v })} />
        <Field
          label="Prompt para IA (imagem/vídeo)"
          value={form.visual_prompt}
          onChange={(v) => setForm({ ...form, visual_prompt: v })}
          textarea
          rows={3}
          placeholder="Ex: cinematic studio photo of a black and gold 1:8 scale technic supercar model kit, dramatic warm lighting, 9:16 aspect ratio"
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar sugestão'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  textarea,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  placeholder?: string
  textarea?: boolean
  rows?: number
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {textarea ? (
        <textarea
          value={value}
          required={required}
          placeholder={placeholder}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
        />
      ) : (
        <input
          type="text"
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
        />
      )}
    </div>
  )
}
