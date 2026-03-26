'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, ChevronLeft, ChevronRight, Trash2,
  Eye, EyeOff, Edit2, Archive, CheckSquare, Square,
} from 'lucide-react'

interface Post {
  id: string
  title: string
  slug: string
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED'
  category: { id: string; name: string } | null
  author: { id: string; name: string | null; email: string }
  updatedAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface Category {
  id: string
  name: string
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  REVIEW: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  PUBLISHED: 'bg-green-500/20 text-green-300 border-green-500/30',
  ARCHIVED: 'bg-slate-700/40 text-slate-500 border-slate-600/30',
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  REVIEW: 'Review',
  PUBLISHED: 'Publicat',
  ARCHIVED: 'Arhivat',
}

export default function PostsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (categoryFilter) params.set('categoryId', categoryFilter)

    const res = await fetch(`/api/posts?${params}`)
    const data = await res.json()
    setPosts(data.posts ?? [])
    setPagination(data.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 })
    setLoading(false)
  }, [page, search, statusFilter, categoryFilter])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  useEffect(() => {
    fetch('/api/categories').then((r) => r.json()).then((d) => setCategories(d.categories ?? []))
  }, [])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [search, statusFilter, categoryFilter])

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === posts.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(posts.map((p) => p.id)))
    }
  }

  async function bulkAction(action: 'publish' | 'archive' | 'delete', ids: string[]) {
    if (action === 'delete') {
      setConfirmDelete(ids)
      return
    }
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/posts/${id}/${action === 'publish' ? 'publish' : 'unpublish'}`, { method: 'POST' })
          .catch(() => null)
      )
    )
    if (action === 'archive') {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/posts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ARCHIVED' }),
          }).catch(() => null)
        )
      )
    }
    setSelected(new Set())
    fetchPosts()
  }

  async function confirmDeletePosts(ids: string[]) {
    await Promise.all(
      ids.map((id) => fetch(`/api/posts/${id}`, { method: 'DELETE' }).catch(() => null))
    )
    setConfirmDelete(null)
    setSelected(new Set())
    fetchPosts()
  }

  async function quickPublish(id: string) {
    await fetch(`/api/posts/${id}/publish`, { method: 'POST' })
    fetchPosts()
  }

  async function quickUnpublish(id: string) {
    await fetch(`/api/posts/${id}/unpublish`, { method: 'POST' })
    fetchPosts()
  }

  const allSelected = posts.length > 0 && selected.size === posts.length
  const someSelected = selected.size > 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{pagination.total} articole total</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
        >
          <Plus size={16} />
          Articol nou
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center p-4 rounded-xl border border-slate-700" style={{ backgroundColor: '#1e293b' }}>
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Caută articole..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg text-sm text-white placeholder-slate-500 border border-slate-600 focus:outline-none focus:border-blue-500 transition"
            style={{ backgroundColor: '#0f172a' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm text-slate-300 border border-slate-600 focus:outline-none focus:border-blue-500 transition"
          style={{ backgroundColor: '#0f172a' }}
        >
          <option value="">Toate statusurile</option>
          <option value="DRAFT">Draft</option>
          <option value="REVIEW">Review</option>
          <option value="PUBLISHED">Publicat</option>
          <option value="ARCHIVED">Arhivat</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm text-slate-300 border border-slate-600 focus:outline-none focus:border-blue-500 transition"
          style={{ backgroundColor: '#0f172a' }}
        >
          <option value="">Toate categoriile</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Bulk actions */}
      {someSelected && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-sm">
          <span className="text-blue-300 font-medium">{selected.size} selectate</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => bulkAction('publish', Array.from(selected))}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 hover:bg-green-500 text-white transition"
            >
              Publică
            </button>
            <button
              onClick={() => bulkAction('archive', Array.from(selected))}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-600 hover:bg-slate-500 text-white transition"
            >
              Arhivează
            </button>
            <button
              onClick={() => bulkAction('delete', Array.from(selected))}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-500 text-white transition"
            >
              Șterge
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-700 overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
            Se încarcă...
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-sm gap-3">
            <p>Niciun articol găsit.</p>
            <Link href="/admin/posts/new" className="text-blue-400 hover:text-blue-300 transition">
              Creează primul articol →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="w-10 px-4 py-3">
                  <button onClick={toggleAll} className="text-slate-400 hover:text-white transition">
                    {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Titlu</th>
                <th className="text-left px-3 py-3 text-xs text-slate-400 font-medium hidden md:table-cell">Categorie</th>
                <th className="text-left px-3 py-3 text-xs text-slate-400 font-medium">Status</th>
                <th className="text-left px-3 py-3 text-xs text-slate-400 font-medium hidden lg:table-cell">Autor</th>
                <th className="text-left px-3 py-3 text-xs text-slate-400 font-medium hidden lg:table-cell">Actualizat</th>
                <th className="w-28 px-3 py-3 text-xs text-slate-400 font-medium text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className={`border-b border-slate-700/50 hover:bg-slate-700/20 transition ${
                    selected.has(post.id) ? 'bg-blue-500/5' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleSelect(post.id)}
                      className="text-slate-400 hover:text-white transition"
                    >
                      {selected.has(post.id) ? <CheckSquare size={16} className="text-blue-400" /> : <Square size={16} />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="text-white hover:text-blue-400 transition font-medium line-clamp-1"
                    >
                      {post.title}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">/{post.slug}</p>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    {post.category ? (
                      <span className="px-2 py-0.5 rounded-md text-xs bg-slate-700 text-slate-300">
                        {post.category.name}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[post.status]}`}>
                      {STATUS_LABELS[post.status]}
                    </span>
                  </td>
                  <td className="px-3 py-3 hidden lg:table-cell text-slate-400 text-xs">
                    {post.author.name || post.author.email}
                  </td>
                  <td className="px-3 py-3 hidden lg:table-cell text-slate-400 text-xs">
                    {new Date(post.updatedAt).toLocaleDateString('ro-RO')}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Link
                        href={`/admin/posts/${post.id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
                        title="Editează"
                      >
                        <Edit2 size={14} />
                      </Link>
                      {post.status === 'PUBLISHED' ? (
                        <button
                          onClick={() => quickUnpublish(post.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-yellow-400 hover:bg-slate-700 transition"
                          title="Retrage publicarea"
                        >
                          <EyeOff size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => quickPublish(post.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-green-400 hover:bg-slate-700 transition"
                          title="Publică"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDelete([post.id])}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition"
                        title="Șterge"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-xs text-slate-500">
            {(page - 1) * pagination.limit + 1}–{Math.min(page * pagination.limit, pagination.total)} din {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-slate-300">
              {page} / {pagination.totalPages}
            </span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl shadow-2xl border border-slate-700" style={{ backgroundColor: '#1e293b' }}>
            <h3 className="text-lg font-semibold text-white mb-2">Confirmare ștergere</h3>
            <p className="text-sm text-slate-400 mb-6">
              {confirmDelete.length === 1
                ? 'Ești sigur că vrei să ștergi acest articol? Acțiunea nu poate fi anulată.'
                : `Ești sigur că vrei să ștergi ${confirmDelete.length} articole? Acțiunea nu poate fi anulată.`}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition"
              >
                Anulează
              </button>
              <button
                onClick={() => confirmDeletePosts(confirmDelete)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition"
              >
                Șterge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
