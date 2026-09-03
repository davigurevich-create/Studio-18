import { useEffect, useState } from 'react'
import { AiRecommender } from '@/components/AiRecommender'
import { getCatalog } from '@/lib/api'
import type { CatalogProduct } from '@/types/catalog'

export function Recomendador() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCatalog().then((p) => {
      setProducts(p)
      setLoading(false)
    })
  }, [])

  return (
    <div style={{ background: '#000000', minHeight: '100vh' }}>
      <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[21/9]">
        <img
          src="/recomendador-banner.jpg"
          alt="Coleção Studio 18 exposta em estante de dois níveis com iluminação indireta"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.75) 85%, #000000 100%)' }}
        />
      </div>
      <div className="pt-4 sm:pt-6">
        {loading ? (
          <p className="py-24 text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
            Carregando...
          </p>
        ) : (
          <AiRecommender products={products} />
        )}
      </div>
    </div>
  )
}
