import { useEffect, useState, type FormEvent } from 'react'
import { createContainer, getContainers } from '@/lib/api'
import { Badge, Button, Card, PageHeader, formatBRL } from '@/components/ui'
import type { Container, ContainerStatus } from '@/types/domain'

const statusTone: Record<ContainerStatus, 'muted' | 'good' | 'warning' | 'info'> = {
  em_transito: 'warning',
  chegou: 'info',
  liberado: 'good',
}

const statusLabel: Record<ContainerStatus, string> = {
  em_transito: 'Em trânsito',
  chegou: 'Chegou',
  liberado: 'Liberado (alfândega)',
}

export function Containers() {
  const [containers, setContainers] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const reload = () => {
    getContainers().then((c) => {
      setContainers(c)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Carregando...</div>

  return (
    <div>
      <PageHeader
        title="Containers"
        description="Remessas vindas da China — status, custos de frete e previsão de chegada"
        action={<Button onClick={() => setShowForm((v) => !v)}>+ Container</Button>}
      />

      {showForm && (
        <ContainerForm
          onDone={() => {
            setShowForm(false)
            reload()
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {containers.map((c) => (
          <Card key={c.id}>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {c.code}
              </span>
              <Badge tone={statusTone[c.status]}>{statusLabel[c.status]}</Badge>
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Origem: {c.origin}
            </div>
            {c.eta_date && (
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Previsão de chegada: {new Date(c.eta_date).toLocaleDateString('pt-BR')}
              </div>
            )}
            {c.arrival_date && (
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Chegou em: {new Date(c.arrival_date).toLocaleDateString('pt-BR')}
              </div>
            )}
            <div className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Frete: {formatBRL(c.freight_cost_brl)} · Alfândega: {formatBRL(c.customs_cost_brl)}
            </div>
            {c.notes && (
              <div className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                {c.notes}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

function ContainerForm({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState('')
  const [eta, setEta] = useState('')
  const [freight, setFreight] = useState('0')
  const [customs, setCustoms] = useState('0')
  const [notes, setNotes] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await createContainer({
      code,
      origin: 'China',
      status: 'em_transito',
      eta_date: eta || null,
      arrival_date: null,
      freight_cost_brl: Number(freight),
      customs_cost_brl: Number(customs),
      notes: notes || null,
    })
    onDone()
  }

  return (
    <Card className="mb-4">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Código
          </label>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Previsão de chegada
          </label>
          <input
            type="date"
            value={eta}
            onChange={(e) => setEta(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Frete (R$)
          </label>
          <input
            type="number"
            value={freight}
            onChange={(e) => setFreight(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Alfândega (R$)
          </label>
          <input
            type="number"
            value={customs}
            onChange={(e) => setCustoms(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="col-span-full">
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Notas
          </label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="col-span-full flex justify-end gap-2">
          <Button type="submit">Salvar container</Button>
        </div>
      </form>
    </Card>
  )
}
