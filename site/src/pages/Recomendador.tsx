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
      <div className="pt-28 sm:pt-32">
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
