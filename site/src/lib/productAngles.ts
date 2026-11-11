import type { CatalogProduct } from '@/types/catalog'

export interface ProductAngle {
  url: string
  label: string | null
}

// sufixo do nome do arquivo (S18-004-traseira.jpg) → rótulo mostrado no card
const ANGLE_LABELS: Record<string, string> = {
  frente: 'Frente',
  lateral: 'Lateral',
  traseira: 'Traseira',
  aberto: 'Aberto',
  motor: 'Motor',
  interior: 'Interior',
  acima: 'De cima',
  detalhe: 'Detalhe',
}

function angleKey(url: string): string | null {
  const match = url.match(/-([a-zà-ú]+)\.[a-z0-9]+(?:\?.*)?$/i)
  return match ? match[1].toLowerCase() : null
}

/**
 * Fotos que o card alterna sozinho quando está em destaque: a capa + até
 * `max - 1` ângulos do carro montado. A foto da caixa fica de fora — no
 * card o que interessa é o modelo, não a embalagem.
 */
export function cardAngles(product: CatalogProduct, max = 3): ProductAngle[] {
  if (!product.image_url) return []
  const angles: ProductAngle[] = [{ url: product.image_url, label: 'Capa' }]
  for (const url of product.image_urls) {
    if (angles.length >= max) break
    const key = angleKey(url)
    if (key === 'caixa' || key === 'box' || url === product.image_url) continue
    angles.push({ url, label: key ? (ANGLE_LABELS[key] ?? null) : null })
  }
  return angles
}
