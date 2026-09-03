import type { CategoryDef } from '@/lib/categories'

export function CategoryBanner({ category, count }: { category: CategoryDef; count: number }) {
  return (
    <div className="relative aspect-[1080/560] w-full overflow-hidden sm:aspect-[2400/500]">
      {/* faixa baixa, estática — só um cabeçalho visual pra seção; os
          produtos da categoria já vêm logo abaixo, sem precisar clicar */}
      <picture>
        <source media="(max-width: 639px)" srcSet={category.bannerMobile} />
        <img src={category.banner} alt={category.title} className="absolute inset-0 h-full w-full object-cover" />
      </picture>

      <span
        className="absolute left-6 top-6 rounded-full px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] backdrop-blur-sm sm:bottom-10 sm:left-10 sm:top-auto"
        style={{ background: 'rgba(6,6,6,0.55)', color: 'var(--ink-secondary)', border: '1px solid var(--hairline)' }}
      >
        {count} {count === 1 ? 'MODELO' : 'MODELOS'}
      </span>
    </div>
  )
}
