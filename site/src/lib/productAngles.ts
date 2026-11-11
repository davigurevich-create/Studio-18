import type { CatalogProduct } from '@/types/catalog'

// sufixo do nome do arquivo: S18-004-caixa.jpg → "caixa"
function angleKey(url: string): string | null {
  const match = url.match(/-([a-zà-ú]+)\.[a-z0-9]+(?:\?.*)?$/i)
  return match ? match[1].toLowerCase() : null
}

/**
 * Fotos que o card alterna sozinho quando está em destaque: a capa + até
 * `max - 1` ângulos do carro montado. A foto da caixa fica de fora — no
 * card o que interessa é o modelo, não a embalagem.
 */
export function cardAngles(product: CatalogProduct, max = 3): string[] {
  if (!product.image_url) return []
  const angles = [product.image_url]
  for (const url of product.image_urls) {
    if (angles.length >= max) break
    const key = angleKey(url)
    if (key === 'caixa' || key === 'box' || url === product.image_url) continue
    angles.push(url)
  }
  return angles
}
