'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Edit2, Trash2, ChevronRight, ChevronDown,
  Check, X, GripVertical,
} from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  postCount: number
  children: Category[]
}

interface FormState {
  name: string
  slug: string
  description: string
  parentId: string
}

const EMPTY_FORM: FormState = { name: '', slug: '', description: '', parentId: '' }

function slugify(text: string) {
  const map: Record<string, string> = {
    ă: 'a', â: 'a', î: 'i', ș: 's', ț: 't',
    Ă: 'a', Â: 'a', Î: 'i', Ș: 's', Ț: 't',
  }
  return text
    .split('').map((c) => map[c] ?? c).join('')
    .toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim()
    .replace(/\s+/g, '-').replace(/-+/g, '-')
}

function CategoryRow({
  cat,
  depth,
  onEdit,
  onDelete,
  expandedIds,
  toggleExpand,
}: {
  cat: Category
  depth: number
  onEdit: (cat: Category) => void
  onDelete: (cat: Category) => void
  expandedIds: Set<string>
  toggleExpand: (id: string) => void
}) {
  const hasChildren = cat.children.length > 0
  const expanded = expandedIds.has(cat.id)

  return (
    <>
      <tr className="border-b border-slate-700/50 hover:bg-slate-700/20 transition group">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
            <GripVertical size={14} className="text-slate-600 opacity-0 group-hover:opacity-100 transition cursor-grab" />
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(cat.id)}
                className="text-slate-400 hover:text-white transition"
              >
                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-[14px]" />
            )}
            <span className="text-white font-medium">{cat.name}</span>
          </div>
        </td>
        <td className="px-3 py-3 text-slate-500 text-xs font-mono">{cat.slug}</td>
        <td className="px-3 py-3 text-slate-400 text-xs hidden md:table-cell line-clamp-1 max-w-xs">
          {cat.description || <span className="text-slate-600">—</span>}
        </td>
        <td className="px-3 py-3 text-center">
          <span className="text-xs text-slate-400">{cat.postCount}</span>
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={() => onEdit(cat)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
              title="Editează"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onDelete(cat)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition"
              title="Șterge"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>
      {expanded &&
        cat.children.map((child) => (
          <CategoryRow
            key={child.id}
            cat={child}
            depth={depth + 1}
            onEdit={onEdit}
            onDelete={onDelete}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
          />
        ))}
    </>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/categories')
    const data = await res.json()
    setCategories(data.categories ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError('')
    setModalOpen(true)
  }

  function openEdit(cat: Category) {
    setEditingId(cat.id)
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? '',
      parentId: cat.parentId ?? '',
    })
    setError('')
    setModalOpen(true)
  }

  function handleNameChange(name: string) {
    setForm((f) => ({
      ...f,
      name,
      slug: editingId ? f.slug : slugify(name),
    }))
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Numele este obligatoriu.'); return }
    setSaving(true)
    setError('')

    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description || null,
      parentId: form.parentId || null,
    }

    const res = editingId
      ? await fetch(`/api/categories/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      : await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) { setError(data.error ?? 'Eroare la salvare.'); return }

    setModalOpen(false)
    fetchCategories()
  }

  async function handleDelete(cat: Category) {
    setDeleteError('')
    const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' })
    const data = await res.json()

    if (!res.ok) {
      setDeleteError(data.error ?? 'Eroare la ștergere.')
      return
    }

    setDeleteTarget(null)
    fetchCategories()
  }

  // Flat list of all categories for parent selector
  function flatList(cats: Category[]): Category[] {
    return cats.flatMap((c) => [c, ...flatList(c.children)])
  }
  const allFlat = flatList(categories)

  const total = allFlat.length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{total} categorii total</p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
        >
          <Plus size={16} />
          Categorie nouă
        </button>
      </div>

      {/* Tree table */}
      <div className="rounded-xl border border-slate-700 overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">Se încarcă...</div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            <p>Nicio categorie creată.</p>
            <button onClick={openCreate} className="mt-2 text-blue-400 hover:text-blue-300 transition text-sm">
              Creează prima categorie →
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Nume</th>
                <th className="text-left px-3 py-3 text-xs text-slate-400 font-medium">Slug</th>
                <th className="text-left px-3 py-3 text-xs text-slate-400 font-medium hidden md:table-cell">Descriere</th>
                <th className="text-center px-3 py-3 text-xs text-slate-400 font-medium">Articole</th>
                <th className="w-24 px-3 py-3 text-xs text-slate-400 font-medium text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  cat={cat}
                  depth={0}
                  onEdit={openEdit}
                  onDelete={(c) => { setDeleteTarget(c); setDeleteError('') }}
                  expandedIds={expandedIds}
                  toggleExpand={toggleExpand}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl shadow-2xl border border-slate-700" style={{ backgroundColor: '#1e293b' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">
                {editingId ? 'Editează categorie' : 'Categorie nouă'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Nume *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-slate-500 border border-slate-600 focus:outline-none focus:border-blue-500 transition"
                  style={{ backgroundColor: '#0f172a' }}
                  placeholder="ex: Știri locale"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg text-sm text-white font-mono placeholder-slate-500 border border-slate-600 focus:outline-none focus:border-blue-500 transition"
                  style={{ backgroundColor: '#0f172a' }}
                  placeholder="stiri-locale"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Categorie părinte</label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm text-slate-300 border border-slate-600 focus:outline-none focus:border-blue-500 transition"
                  style={{ backgroundColor: '#0f172a' }}
                >
                  <option value="">— fără părinte —</option>
                  {allFlat
                    .filter((c) => c.id !== editingId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Descriere</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-slate-500 border border-slate-600 focus:outline-none focus:border-blue-500 transition resize-none"
                  style={{ backgroundColor: '#0f172a' }}
                  placeholder="Opțional..."
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition"
              >
                Anulează
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition"
              >
                {saving ? 'Se salvează...' : <><Check size={14} /> Salvează</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl shadow-2xl border border-slate-700" style={{ backgroundColor: '#1e293b' }}>
            <h3 className="text-lg font-semibold text-white mb-2">Șterge categorie</h3>
            <p className="text-sm text-slate-400 mb-2">
              Ești sigur că vrei să ștergi <strong className="text-white">{deleteTarget.name}</strong>?
            </p>
            {deleteError && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
                {deleteError}
              </p>
            )}
            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => { setDeleteTarget(null); setDeleteError('') }}
                className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition"
              >
                Anulează
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
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
