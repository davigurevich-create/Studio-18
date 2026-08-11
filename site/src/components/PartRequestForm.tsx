import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Factory, ImagePlus, Printer, X } from 'lucide-react'
import { getCatalog, submitPartRequest, uploadPartRequestPhoto, type MyOrder, type PartRequestInput } from '@/lib/api'
import { formatBRL } from '@/lib/format'
import type { CatalogProduct } from '@/types/catalog'

const MAX_PHOTO_BYTES = 5 * 1024 * 1024

const replacementOptions: {
  id: PartRequestInput['replacementType']
  icon: typeof Printer
  title: string
  hint: string
}[] = [
  {
    id: 'impressao_3d',
    icon: Printer,
    title: 'Peça impressa em 3D',
    hint: 'Produzida no nosso estúdio e enviada em até 2 dias úteis.',
  },
  {
    id: 'original_fabricante',
    icon: Factory,
    title: 'Peça original do fabricante',
    hint: 'Solicitada direto ao fabricante — prazo de envio maior.',
  },
]

/**
 * Formulário de peça faltante dentro da área logada — o pedido é escolhido
 * de uma lista dos pedidos reais do cliente (não mais digitado em texto
 * livre), e nome/e-mail vêm da sessão, não deste formulário.
 */
export function PartRequestForm({ orders, onSubmitted }: { orders: MyOrder[]; onSubmitted?: () => void }) {
  const [catalog, setCatalog] = useState<CatalogProduct[]>([])
  const [orderId, setOrderId] = useState(orders[0]?.id ?? '')
  const [productModel, setProductModel] = useState('')
  const [partDescription, setPartDescription] = useState('')
  const [replacementType, setReplacementType] = useState<PartRequestInput['replacementType']>('impressao_3d')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getCatalog().then(setCatalog)
  }, [])

  useEffect(() => {
    // Revoga a URL local anterior sempre que a foto muda, para não vazar
    // memória com blobs esquecidos no navegador.
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Anexe apenas arquivos de imagem.')
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('A imagem deve ter no máximo 5 MB.')
      return
    }
    setError(null)
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const photoUrl = photoFile ? await uploadPartRequestPhoto(photoFile) : undefined
      await submitPartRequest({
        orderId,
        productModel,
        partDescription,
        replacementType,
        photoUrl,
      })
      setDone(true)
      onSubmitted?.()
    } catch {
      setError('Não foi possível enviar sua solicitação agora. Tente novamente em instantes.')
    } finally {
      setSubmitting(false)
    }
  }

  if (orders.length === 0) {
    return (
      <div
        className="rounded-2xl border p-6 text-center text-sm sm:p-8"
        style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)', color: 'var(--ink-muted)' }}
      >
        Você ainda não tem nenhum pedido para vincular uma solicitação de peça faltante.
      </div>
    )
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center rounded-2xl border p-10 text-center"
        style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
      >
        <div className="mb-4 text-4xl" style={{ color: 'var(--gold)' }}>✓</div>
        <h3 className="mb-2 text-xl" style={{ color: 'var(--ink)' }}>
          Solicitação recebida!
        </h3>
        <p className="max-w-md text-sm" style={{ color: 'var(--ink-secondary)' }}>
          Já registramos seu pedido de reposição e enviamos um e-mail de confirmação. Nossa equipe cuida do resto —
          sem nenhum custo para você.
        </p>
      </motion.div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-2xl flex-col gap-6 rounded-2xl border p-6 sm:p-8"
      style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
            PEDIDO
          </label>
          <select
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            required
            className="w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm outline-none"
            style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id} style={{ color: 'var(--ink)', background: 'var(--carbon-2)' }}>
                #{o.id.slice(0, 8)} — {new Date(o.sale_date).toLocaleDateString('pt-BR')} —{' '}
                {o.items.map((i) => i.product_name).join(', ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
            MODELO DO SET
          </label>
          <select
            value={productModel}
            onChange={(e) => setProductModel(e.target.value)}
            required
            className="w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm outline-none"
            style={{ borderColor: 'var(--hairline)', color: productModel ? 'var(--ink)' : 'var(--ink-muted)' }}
          >
            <option value="" disabled style={{ color: 'var(--ink-muted)' }}>
              Selecione o modelo...
            </option>
            {catalog.map((p) => (
              <option key={p.id} value={p.name} style={{ color: 'var(--ink)', background: 'var(--carbon-2)' }}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
          DESCREVA A PEÇA FALTANTE
        </label>
        <textarea
          value={partDescription}
          onChange={(e) => setPartDescription(e.target.value)}
          required
          rows={3}
          placeholder="Ex: peça pequena cinza, formato de suporte, próxima ao eixo dianteiro esquerdo..."
          className="w-full resize-none rounded-lg border bg-transparent px-4 py-3 text-sm outline-none"
          style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
        />
      </div>

      <div>
        <label className="mb-2 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
          FOTO DA PEÇA (OPCIONAL)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="hidden"
        />
        {photoPreview ? (
          <div className="flex items-center gap-3">
            <img src={photoPreview} alt="Prévia da foto anexada" className="h-20 w-20 rounded-lg object-cover" />
            <button
              type="button"
              onClick={removePhoto}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs"
              style={{ borderColor: 'var(--hairline)', color: 'var(--ink-muted)' }}
            >
              <X size={14} />
              Remover
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm"
            style={{ borderColor: 'var(--hairline)', color: 'var(--ink-muted)' }}
          >
            <ImagePlus size={18} strokeWidth={1.75} />
            Anexar uma foto que ajude a identificar a peça
          </button>
        )}
      </div>

      <div>
        <label className="mb-3 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
          COMO VOCÊ PREFERE RECEBER A REPOSIÇÃO?
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {replacementOptions.map((opt) => {
            const Icon = opt.icon
            const active = replacementType === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setReplacementType(opt.id)}
                className="rounded-xl border p-4 text-left transition"
                style={{
                  borderColor: active ? 'var(--gold)' : 'var(--hairline)',
                  background: active ? 'var(--gold-wash)' : 'var(--carbon-1)',
                }}
              >
                <Icon size={20} strokeWidth={1.75} style={{ color: active ? 'var(--gold-bright)' : 'var(--ink-muted)' }} />
                <div className="mt-2 text-sm font-medium" style={{ color: active ? 'var(--gold-bright)' : 'var(--ink)' }}>
                  {opt.title}
                </div>
                <div className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>
                  {opt.hint}
                </div>
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-xs" style={{ color: 'var(--gold-bright)' }}>
          As duas opções são 100% gratuitas — nunca cobramos pela reposição de peças.
        </p>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(208,59,59,0.12)', color: '#e88b8b' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full px-8 py-3 text-sm font-medium tracking-wide disabled:opacity-60"
        style={{ background: 'var(--gold)', color: '#0a0a0a' }}
      >
        {submitting ? 'Enviando...' : 'Enviar solicitação'}
      </button>
    </form>
  )
}

export function formatOrderTotal(order: MyOrder): string {
  return formatBRL(order.items.reduce((t, i) => t + i.unit_price_brl * i.quantity, 0))
}
