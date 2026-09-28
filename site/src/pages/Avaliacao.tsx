import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Star, ImagePlus, X } from 'lucide-react'
import { submitTestimonial, uploadTestimonialPhoto } from '@/lib/api'

const MAX_PHOTO_BYTES = 5 * 1024 * 1024

export function Avaliacao() {
  const { saleId } = useParams<{ saleId: string }>()
  const [email, setEmail] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [message, setMessage] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!saleId) return
    if (rating === 0) {
      setError('Escolha uma nota de 1 a 5 estrelas.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const photoUrl = photoFile ? await uploadTestimonialPhoto(photoFile) : undefined
      await submitTestimonial({ saleId, email, customerName, rating, message, photoUrl })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar seu depoimento agora. Tente novamente em instantes.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-6 pb-24 pt-32 text-center">
        <div className="mb-4 text-4xl" style={{ color: 'var(--gold)' }}>✓</div>
        <h1 className="mb-3 text-3xl">Obrigado pelo depoimento!</h1>
        <p className="mb-2 text-sm" style={{ color: 'var(--ink-secondary)' }}>
          Já creditamos <strong style={{ color: 'var(--gold-bright)' }}>1000 pontos</strong> na sua conta como agradecimento.
        </p>
        <p className="mb-8 text-sm" style={{ color: 'var(--ink-muted)' }}>
          Seu depoimento passa por uma revisão rápida da nossa equipe antes de aparecer no site.
        </p>
        <Link to="/" className="text-sm" style={{ color: 'var(--gold)' }}>
          ← Voltar para a coleção
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-6 pb-24 pt-32">
      <p className="eyebrow mb-3">Conte pra gente</p>
      <h1 className="mb-2 text-3xl">Como ficou o seu set?</h1>
      <p className="mb-8 text-sm" style={{ color: 'var(--ink-secondary)' }}>
        Deixe seu depoimento e ganhe <strong style={{ color: 'var(--gold-bright)' }}>1000 pontos de bônus</strong> — leva menos de 2 minutos.
      </p>

      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Seu nome" value={customerName} onChange={setCustomerName} required />
          <Field label="E-mail usado na compra" value={email} onChange={setEmail} type="email" required />
        </div>

        <div>
          <label className="mb-2 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
            SUA NOTA
          </label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
                className="p-0.5"
              >
                <Star
                  size={28}
                  strokeWidth={1.5}
                  fill={(hoverRating || rating) >= n ? 'var(--gold-bright)' : 'transparent'}
                  style={{ color: (hoverRating || rating) >= n ? 'var(--gold-bright)' : 'var(--ink-muted)' }}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
            SEU DEPOIMENTO
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            placeholder="Conte como foi montar o set, a qualidade das peças, o que mais gostou..."
            className="w-full resize-none rounded-lg border bg-transparent px-4 py-3 text-sm outline-none"
            style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
            FOTO DO SET MONTADO (OPCIONAL)
          </label>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          {photoPreview ? (
            <div className="flex items-center gap-3">
              <img src={photoPreview} alt="Prévia da foto do set" className="h-20 w-20 rounded-lg object-cover" />
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
              Anexar uma foto do seu set montado
            </button>
          )}
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
          {submitting ? 'Enviando...' : 'Enviar depoimento'}
        </button>
      </form>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  type?: string
}) {
  return (
    <div>
      <label className="mb-2 block text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
        {label.toUpperCase()}
      </label>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm outline-none"
        style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
      />
    </div>
  )
}
