import type { CatalogProduct } from '@/types/catalog'

const CarGlyph = () => (
  <svg viewBox="0 0 200 90" fill="none" className="h-auto w-2/3 max-w-[220px]">
    <path
      d="M20 62 L34 34 Q42 24 58 24 L128 24 Q144 24 152 34 L166 58 L178 60 Q184 61 184 67 L184 70 L166 70 M20 62 L14 62 Q10 62 10 66 L10 68 Q10 71 14 71 L34 71 M20 62 L166 70"
      stroke="var(--gold)"
      strokeWidth="1.4"
      strokeLinejoin="round"
      strokeLinecap="round"
      opacity="0.85"
    />
    <circle cx="52" cy="71" r="12" stroke="var(--gold)" strokeWidth="1.4" opacity="0.85" />
    <circle cx="146" cy="71" r="12" stroke="var(--gold)" strokeWidth="1.4" opacity="0.85" />
    <path d="M56 34 L66 24 M118 24 L128 34" stroke="var(--gold)" strokeWidth="1" opacity="0.5" />
  </svg>
)

const MotoGlyph = () => (
  <svg viewBox="0 0 200 100" fill="none" className="h-auto w-2/3 max-w-[220px]">
    <circle cx="46" cy="72" r="18" stroke="var(--gold)" strokeWidth="1.4" opacity="0.85" />
    <circle cx="154" cy="72" r="18" stroke="var(--gold)" strokeWidth="1.4" opacity="0.85" />
    <path
      d="M46 72 L84 44 L110 44 L128 72 M84 44 L92 30 L112 30 M110 44 L154 72 M46 72 L70 60"
      stroke="var(--gold)"
      strokeWidth="1.4"
      strokeLinejoin="round"
      strokeLinecap="round"
      opacity="0.85"
    />
  </svg>
)

export function ProductArt({ product, className = '' }: { product: CatalogProduct; className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        background:
          'radial-gradient(circle at 50% 30%, rgba(205,164,77,0.10), transparent 60%), linear-gradient(160deg, var(--carbon-3), var(--carbon-1))',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'repeating-linear-gradient(115deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 4px)',
        }}
      />
      {product.category === 'moto' ? <MotoGlyph /> : <CarGlyph />}
      <div
        className="absolute bottom-3 right-3 rounded-full border px-2 py-0.5 text-[10px] tracking-widest"
        style={{ borderColor: 'var(--gold-dim)', color: 'var(--ink-muted)' }}
      >
        FOTO EM BREVE
      </div>
    </div>
  )
}
