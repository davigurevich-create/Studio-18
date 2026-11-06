// Placeholder exibido no lugar dos cards de produto enquanto a coleção
// ainda está carregando — mesmas proporções do ProductCard de verdade, com
// um shimmer passando por cima pra sinalizar "carregando" de forma mais
// premium que um texto solto.
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}>
      <div className="skeleton-shimmer h-52 w-full" />
      <div className="flex flex-col gap-2 p-4">
        <div className="skeleton-shimmer h-4 w-3/4 rounded" />
        <div className="skeleton-shimmer h-3 w-1/2 rounded" />
        <div className="skeleton-shimmer mt-2 h-5 w-2/3 rounded" />
      </div>
    </div>
  )
}
