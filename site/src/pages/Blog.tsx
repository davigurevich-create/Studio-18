import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getBlogPosts } from '@/lib/api'
import type { BlogPost } from '@/types/catalog'

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function Blog() {
  const [posts, setPosts] = useState<BlogPost[] | undefined>(undefined)

  useEffect(() => {
    getBlogPosts().then(setPosts)
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-6 pb-24 pt-32">
      <p className="eyebrow mb-3 text-center">Studio 18</p>
      <h1 className="mb-3 text-center text-3xl sm:text-4xl">Blog</h1>
      <p className="mx-auto mb-14 max-w-xl text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
        Histórias, bastidores e curiosidades sobre engenharia, colecionismo e o universo dos sets técnicos.
      </p>

      {posts === undefined ? (
        <p className="text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
          Carregando artigos...
        </p>
      ) : posts.length === 0 ? (
        <p className="text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
          Ainda não publicamos nenhum artigo — volte em breve.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: (i % 6) * 0.05 }}
            >
              <Link
                to={`/blog/${post.slug}`}
                className="group block h-full overflow-hidden rounded-xl border transition-colors"
                style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--gold-dim)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--hairline)')}
              >
                {post.cover_image_url && (
                  <div className="h-48 w-full overflow-hidden">
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="mb-2 text-[11px] tracking-widest" style={{ color: 'var(--ink-muted)' }}>
                    {formatDate(post.published_at).toUpperCase()}
                  </div>
                  <h2 className="mb-2 text-lg font-medium leading-snug" style={{ color: 'var(--ink)' }}>
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                      {post.excerpt}
                    </p>
                  )}
                  <div className="mt-4 text-xs font-medium tracking-wide" style={{ color: 'var(--gold)' }}>
                    Ler artigo →
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
