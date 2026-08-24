const GALLERY_LABELS: Record<string, string> = {
  frente: 'Frente',
  lateral: 'Lateral',
  lado: 'Lateral',
  traseira: 'Traseira',
  detalhe: 'Detalhe',
  detail: 'Detalhe',
  interior: 'Interior',
  motor: 'Motor',
  aberto: 'Aberto',
  acima: 'Acima',
  above: 'Acima',
  caixa: 'Caixa',
  box: 'Caixa',
}

/** Derives a display label from a gallery image filename, e.g. "S18-016-lateral.jpg" -> "Lateral". */
export function labelForGalleryImage(url: string, index: number): string {
  if (index === 0) return 'Principal'
  const fileName = url.split('/').pop() ?? ''
  const match = fileName.match(/-([a-z0-9]+)\.[a-z0-9]+$/i)
  const key = match?.[1]?.toLowerCase()
  if (key && GALLERY_LABELS[key]) return GALLERY_LABELS[key]
  return `Foto ${index + 1}`
}
