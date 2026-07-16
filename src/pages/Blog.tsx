import { useEffect, useState, type FormEvent } from 'react'
import { createBlogPost, deleteBlogPost, getBlogPosts, updateBlogPost } from '@/lib/api'
import { Badge, Button, Card, PageHeader } from '@/components/ui'
import type { BlogPost } from '@/types/domain'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)

  const reload = () => {
    getBlogPosts().then((p) => {
      setPosts(p)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  const startEdit = (post: BlogPost) => {
    setEditingPost(post)
    setShowForm(true)
  }

  const startCreate = () => {
    setEditingPost(null)
    setShowForm(true)
  }

  const togglePublished = async (post: BlogPost) => {
    await updateBlogPost(
      post.id,
      {
        published: !post.published,
        published_at: !post.published ? new Date().toISOString() : post.published_at,
      },
      `${!post.published ? 'Publicou' : 'Despublicou'} o post "${post.title}"`,
    )
    reload()
  }

  const remove = async (post: BlogPost) => {
    if (!confirm(`Excluir o artigo "${post.title}"? Essa ação não pode ser desfeita.`)) return
    await deleteBlogPost(post.id, post.title)
    reload()
  }

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Carregando...</div>

  const pendingAiDrafts = posts.filter((p) => p.ai_generated && !p.published)

  return (
    <div>
      <PageHeader
        title="Blog"
        description="Artigos publicados na seção de blog do site"
        action={<Button onClick={startCreate}>+ Novo artigo</Button>}
      />

      {pendingAiDrafts.length > 0 && (
        <div
          className="mb-4 rounded-lg px-4 py-3 text-sm"
          style={{ background: 'rgba(250,178,25,0.16)', color: '#8a5b00' }}
        >
          {pendingAiDrafts.length === 1
            ? '1 artigo gerado automaticamente está aguardando sua revisão e aprovação.'
            : `${pendingAiDrafts.length} artigos gerados automaticamente estão aguardando sua revisão e aprovação.`}
        </div>
      )}

      {showForm && (
        <BlogPostForm
          post={editingPost}
          onDone={() => {
            setShowForm(false)
            setEditingPost(null)
            reload()
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingPost(null)
          }}
        />
      )}

      <Card className="mt-4 overflow-x-auto">
        {posts.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Nenhum artigo criado ainda.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ color: 'var(--text-muted)' }}>
                <th className="pb-2 font-medium">Título</th>
                <th className="pb-2 font-medium">Autor</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Atualizado em</th>
                <th className="pb-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-t align-top" style={{ borderColor: 'var(--gridline)' }}>
                  <td className="py-2.5" style={{ color: 'var(--text-primary)' }}>
                    <div className="font-medium">{post.title}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      /blog/{post.slug}
                    </div>
                  </td>
                  <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {post.author}
                  </td>
                  <td className="py-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone={post.published ? 'good' : post.ai_generated ? 'warning' : 'muted'}>
                        {post.published ? 'Publicado' : 'Rascunho'}
                      </Badge>
                      {post.ai_generated && <Badge tone="info">Gerado por IA</Badge>}
                    </div>
                  </td>
                  <td className="py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(post.updated_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-2.5">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => startEdit(post)}>
                        Editar
                      </Button>
                      <Button variant="secondary" onClick={() => togglePublished(post)}>
                        {post.published ? 'Despublicar' : 'Publicar'}
                      </Button>
                      <Button variant="secondary" onClick={() => remove(post)}>
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}

function BlogPostForm({
  post,
  onDone,
  onCancel,
}: {
  post: BlogPost | null
  onDone: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(post?.title ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(post))
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(post?.cover_image_url ?? '')
  const [content, setContent] = useState(post?.content ?? '')
  const [author, setAuthor] = useState(post?.author ?? 'Studio 18')
  const [published, setPublished] = useState(post?.published ?? false)
  const [saving, setSaving] = useState(false)

  const handleTitleChange = (v: string) => {
    setTitle(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        title,
        slug: slugify(slug),
        excerpt: excerpt || null,
        cover_image_url: coverImageUrl || null,
        content,
        author,
        published,
        published_at: published ? (post?.published_at ?? new Date().toISOString()) : post?.published_at ?? null,
        ai_generated: post?.ai_generated ?? false,
      }
      if (post) {
        await updateBlogPost(post.id, payload, `Editou o post "${payload.title}"`)
      } else {
        await createBlogPost(payload)
      }
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="mb-4">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Título" value={title} onChange={handleTitleChange} required />
          <Field
            label="Slug (URL)"
            value={slug}
            onChange={(v) => {
              setSlugTouched(true)
              setSlug(v)
            }}
            required
            hint="Aparece em /blog/seu-slug — use só letras minúsculas, números e hífens."
          />
        </div>
        <Field
          label="Resumo (aparece na listagem)"
          value={excerpt}
          onChange={setExcerpt}
          textarea
          rows={2}
        />
        <Field
          label="Imagem de capa (URL)"
          value={coverImageUrl}
          onChange={setCoverImageUrl}
          placeholder="https://..."
        />
        <Field
          label="Conteúdo do artigo"
          value={content}
          onChange={setContent}
          textarea
          rows={10}
          required
          hint="Separe os parágrafos com uma linha em branco. Subtítulo: comece a linha com '## '. Lista: comece cada linha com '- '. Negrito: **assim**."
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Autor" value={author} onChange={setAuthor} />
          <label className="flex items-center gap-2 pt-6 text-sm" style={{ color: 'var(--text-primary)' }}>
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Publicado (visível no site)
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar artigo'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  hint,
  textarea,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  placeholder?: string
  hint?: string
  textarea?: boolean
  rows?: number
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {textarea ? (
        <textarea
          value={value}
          required={required}
          placeholder={placeholder}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
        />
      ) : (
        <input
          type="text"
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border-hairline)', background: 'transparent', color: 'var(--text-primary)' }}
        />
      )}
      {hint && (
        <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {hint}
        </p>
      )}
    </div>
  )
}
