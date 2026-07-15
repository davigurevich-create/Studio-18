import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getBlogPost } from '@/lib/api'
import { renderBlogContent } from '@/lib/richText'
import type { BlogPost as BlogPostType } from '@/types/catalog'

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPostType | null | undefined>(undefined)

  useEffect(() => {
    if (!slug) return
    getBlogPost(slug).then((p) => setPost(p ?? null))
  }, [slug])

  if (post === undefined) {
    return <div className="px-6 py-40 text-center" style={{ color: 'var(--ink-muted)' }}>Carregando...</div>
  }

  if (post === null) {
    return (
      <div className="px-6 py-40 text-center">
        <p style={{ color: 'var(--ink-muted)' }}>Artigo não encontrado.</p>
        <Link to="/blog" className="mt-4 inline-block text-sm" style={{ color: 'var(--gold)' }}>
          Voltar para o blog
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 pt-32">
      <Link to="/blog" className="mb-8 inline-block text-sm" style={{ color: 'var(--ink-muted)' }}>
        ← Voltar para o blog
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-4 text-xs tracking-widest" style={{ color: 'var(--ink-muted)' }}>
          {formatDate(post.published_at).toUpperCase()} · {post.author.toUpperCase()}
        </div>
        <h1 className="mb-8 text-3xl sm:text-4xl">{post.title}</h1>

        {post.cover_image_url && (
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="mb-10 aspect-video w-full rounded-xl object-cover"
          />
        )}

        <div className="flex flex-col gap-5">{renderBlogContent(post.content)}</div>
      </motion.div>

      <div className="mt-14 border-t pt-8 text-center" style={{ borderColor: 'var(--hairline)' }}>
        <a
          href="/#colecao"
          className="inline-block rounded-full px-8 py-3 text-sm font-medium tracking-wide"
          style={{ background: 'var(--gold)', color: '#0a0a0a' }}
        >
          Ver a coleção
        </a>
      </div>
    </div>
  )
}
