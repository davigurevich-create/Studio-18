// Vitrine por categoria da coleção — curadoria manual por SKU (não usa
// `collection_tag` do banco, que tem uma divisão mais granular/antiga).
// Ordem deste array = ordem de exibição dos banners na home.
export interface CategoryDef {
  slug: string
  title: string
  tagline: string
  banner: string
  bannerMobile: string
  skus: string[]
}

export const categories: CategoryDef[] = [
  {
    slug: 'supercarros',
    title: 'Supercarros',
    tagline: 'O topo da engenharia automotiva, em escala.',
    banner: '/banner-supercarros.png',
    bannerMobile: '/banner-supercarros-mobile.png',
    skus: [
      'S18-001', // Lamborghini LP5000
      'S18-005', // Pagani Utopia
      'S18-006', // Lotus Exige Cup 430
      'S18-008', // Lamborghini Centenario
      'S18-009', // Maserati Gran Turismo
      'S18-011', // Bugatti Tourbillon
      'S18-012', // Lamborghini Temerario
      'S18-013', // Nissan GTR Liberty Walk
      'S18-014', // Ferrari Enzo
      'S18-015', // Ferrari SF90 XX Stradale
      'S18-017', // Lamborghini Aventador SVJ
      'S18-018', // Audi RS6 Avant
      'S18-020', // McLaren Senna GTR
      'S18-021', // Aston Martin Valour
    ],
  },
  {
    slug: 'lemans-gt',
    title: 'Lemans & GT',
    tagline: 'Resistência e velocidade das pistas lendárias.',
    banner: '/banner-lemans-gt.png',
    bannerMobile: '/banner-lemans-gt-mobile.png',
    skus: [
      'S18-003', // Porsche 963
      'S18-007', // Mazda 787B
      'S18-004', // BMW M4 GT4
    ],
  },
  {
    slug: 'formula',
    title: 'Fórmula',
    tagline: 'A precisão da categoria mais rápida das pistas.',
    banner: '/banner-formula.png',
    bannerMobile: '/banner-formula-mobile.png',
    skus: [
      'S18-010', // Fórmula 1 Edição Especial
    ],
  },
  {
    slug: 'off-road',
    title: 'Off-Road',
    tagline: 'Força bruta pra encarar qualquer terreno.',
    banner: '/banner-offroad.png',
    bannerMobile: '/banner-offroad-mobile.png',
    skus: [
      'S18-016', // Land Rover Defender
    ],
  },
  {
    slug: 'motos',
    title: 'Motos',
    tagline: 'Duas rodas, adrenalina pura.',
    banner: '/banner-motos.png',
    bannerMobile: '/banner-motos-mobile.png',
    skus: [
      'S18-002', // BMW R1300GS
      'S18-019', // Zero Pulse
    ],
  },
]
