import type { BlogPost } from '@/types/catalog'

export const mockBlogPosts: BlogPost[] = [
  {
    id: 'demo-1',
    slug: 'por-que-escala-1-8',
    title: 'Por que a escala 1:8 é a favorita dos colecionadores',
    excerpt: 'Entenda por que essa proporção específica virou padrão entre os sets técnicos mais cobiçados do mundo.',
    cover_image_url: '/hero-workshop.jpg',
    author: 'Studio 18',
    published_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    content:
      'A escala 1:8 ocupa um lugar especial entre colecionadores de sets técnicos. Ela é grande o suficiente para revelar detalhes de engenharia que escalas menores simplesmente não conseguem reproduzir — suspensões funcionais, câmbios sequenciais, motores com pistões que se movem de verdade.\n\nAo mesmo tempo, é compacta o bastante para caber com dignidade numa estante ou mesa de escritório, sem exigir o espaço de uma vitrine inteira.\n\nEssa combinação de fidelidade técnica e praticidade é o motivo pelo qual a maioria dos fabricantes premium concentra seus lançamentos mais ambiciosos justamente nessa proporção.',
  },
  {
    id: 'demo-2',
    slug: 'ritual-da-montagem',
    title: 'O ritual da montagem: por que vale a pena desacelerar',
    excerpt: 'Montar um set técnico não é uma corrida — é um convite para desligar o piloto automático por algumas horas.',
    cover_image_url: null,
    author: 'Studio 18',
    published_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    content:
      'Vivemos numa época obcecada por velocidade. Ainda assim, existe algo profundamente satisfatório em passar horas encaixando peça por peça, seguindo um manual, sem pressa.\n\nMontar um set técnico é isso: um convite para desacelerar. Cada etapa exige atenção plena. Cada clique de uma peça no lugar certo entrega uma pequena dose de satisfação imediata.\n\nNão é à toa que tantos colecionadores descrevem a montagem como uma forma de meditação ativa — as mãos ocupadas, a mente presente, o resultado final é uma escultura de engenharia construída com as próprias mãos.',
  },
]
