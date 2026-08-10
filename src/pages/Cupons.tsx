import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { addCoupon, deleteCoupon, getCoupons, setCouponActive } from '@/lib/api'
import { Badge, Button, Card, PageHeader } from '@/components/ui'
import type { Coupon } from '@/types/domain'

function couponState(c: Coupon): { label: string; tone: 'good' | 'warning' | 'critical' | 'muted' } {
  if (!c.active) return { label: 'Inativo', tone: 'muted' }
  if (c.expires_at && new Date(c.expires_at) <= new Date()) return { label: 'Expirado', tone: 'critical' }
  if (c.max_uses != null && c.uses_count >= c.max_uses) return { label: 'Esgotado', tone: 'warning' }
  return { label: 'Ativo', tone: 'good' }
}

export function Cupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const reload = () => {
    getCoupons().then((c) => {
      setCoupons(c)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  const activeCount = useMemo(() => coupons.filter((c) => couponState(c).tone === 'good').length, [coupons])

  const toggleActive = async (c: Coupon) => {
    await setCouponActive(c.id, c.code, !c.active)
    reload()
  }

  const removeCoupon = async (c: Coupon) => {
    if (!confirm(`Excluir o cupom "${c.code}"? Essa ação não pode ser desfeita.`)) return
    await deleteCoupon(c.id, c.code)
    reload()
  }

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Carregando...</div>

  return (
    <div>
      <PageHeader
        title="Cupons"
        description="Cupons de desconto para parcerias com influenciadores — validados automaticamente no checkout do site"
        action={<Button onClick={() => setShowForm((v) => !v)}>+ Cupom</Button>}
      />

      {showForm && (
        <CouponForm
          onDone={() => {
            setShowForm(false)
            reload()
          }}
        />
      )}

      <div className="mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        {activeCount} cupom{activeCount !== 1 ? 's' : ''} ativo{activeCount !== 1 ? 's' : ''} de {coupons.length}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left" style={{ color: 'var(--text-muted)' }}>
              <th className="pb-2 font-medium">Código</th>
              <th className="pb-2 font-medium">Desconto</th>
              <th className="pb-2 font-medium">Influenciador</th>
              <th className="pb-2 font-medium">Usos</th>
              <th className="pb-2 font-medium">Validade</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Nenhum cupom cadastrado ainda.
                </td>
              </tr>
            ) : (
              coupons.map((c) => {
                const state = couponState(c)
                return (
                  <tr key={c.id} className="border-t" style={{ borderColor: 'var(--gridline)' }}>
                    <td className="py-2.5 font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
                      {c.code}
                    </td>
                    <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                      {c.discount_pct}%
                    </td>
                    <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                      {c.influencer_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                      {c.uses_count}
                      {c.max_uses != null ? ` / ${c.max_uses}` : ''}
                    </td>
                    <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString('pt-BR') : 'Sem validade'}
                    </td>
                    <td className="py-2.5">
                      <Badge tone={state.tone}>{state.label}</Badge>
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => toggleActive(c)}
                          className="text-xs font-medium hover:underline"
                          style={{ color: 'var(--series-1)' }}
                        >
                          {c.active ? 'Desativar' : 'Reativar'}
                        </button>
                        <button
                          onClick={() => removeCoupon(c)}
                          className="text-xs font-medium hover:underline"
                          style={{ color: 'var(--status-critical)' }}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function CouponForm({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState('')
  const [discountPct, setDiscountPct] = useState('8')
  const [influencerName, setInfluencerName] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await addCoupon({
        code,
        discount_pct: Number(discountPct),
        influencer_name: influencerName || null,
        active: true,
        max_uses: maxUses ? Number(maxUses) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      })
      onDone()
    } catch (err) {
      setError(err instanceof Error && /duplicate|unique/i.test(err.message) ? 'Já existe um cupom com esse código.' : 'Não foi possível criar o cupom.')
    }
  }

  return (
    <Card className="mb-4">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Código
          </label>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="EX: GARAGEM8"
            className="w-full rounded-lg border px-3 py-2 text-sm uppercase"
            style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Desconto (%)
          </label>
          <input
            type="number"
            required
            min={1}
            max={100}
            step="0.1"
            value={discountPct}
            onChange={(e) => setDiscountPct(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Influenciador / parceria
          </label>
          <input
            value={influencerName}
            onChange={(e) => setInfluencerName(e.target.value)}
            placeholder="Nome do perfil ou campanha"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Limite de usos
          </label>
          <input
            type="number"
            min={1}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="Sem limite"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Validade (opcional)
          </label>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
          />
        </div>
        {error && (
          <div className="col-span-full text-xs" style={{ color: 'var(--status-critical)' }}>
            {error}
          </div>
        )}
        <div className="col-span-full flex justify-end gap-2">
          <Button type="submit">Criar cupom</Button>
        </div>
      </form>
    </Card>
  )
}
