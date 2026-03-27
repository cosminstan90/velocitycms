'use client'

import { useEffect, useState } from 'react'
import { User, Camera, Globe, Briefcase, FileText, Save, CheckCircle2, AlertCircle } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  name: string | null
  slug: string | null
  title: string | null
  bio: string | null
  photo: string | null
  website: string | null
  role: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    title: '',
    bio: '',
    photo: '',
    website: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/users/me')
      .then((r) => r.json())
      .then((data) => {
        const u: UserProfile = data.user
        setProfile(u)
        setForm({
          name: u.name ?? '',
          slug: u.slug ?? '',
          title: u.title ?? '',
          bio: u.bio ?? '',
          photo: u.photo ?? '',
          website: u.website ?? '',
        })
      })
      .finally(() => setLoading(false))
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Auto-generate slug from name if slug is empty
  function handleNameBlur() {
    if (!form.slug && form.name) {
      const slug = form.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setForm((prev) => ({ ...prev, slug }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Eroare la salvare.' })
      } else {
        setProfile(data.user)
        setMessage({ type: 'success', text: 'Profilul a fost salvat.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Eroare de rețea.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Se încarcă...
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profilul meu</h1>
        <p className="mt-1 text-sm text-gray-500">
          Informațiile de profil sunt afișate pe paginile de autor și în structured data (EEAT).
        </p>
      </div>

      {/* Preview card */}
      {profile && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-4 items-start">
          <div className="w-14 h-14 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {form.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.photo} alt={form.name || 'Avatar'} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-amber-700">
                {(form.name || profile.email).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{form.name || profile.email}</p>
            {form.title && <p className="text-sm text-amber-700 font-medium">{form.title}</p>}
            {form.bio && <p className="text-sm text-gray-600 mt-1">{form.bio}</p>}
            {form.slug && (
              <p className="text-xs text-gray-400 mt-1">/autor/{form.slug}</p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <User className="inline w-4 h-4 mr-1 mb-0.5" />
            Nume afișat
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            onBlur={handleNameBlur}
            placeholder="Ex: Dr. Maria Ionescu"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug autor
            <span className="ml-2 text-xs text-gray-400 font-normal">folosit în URL: /autor/[slug]</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">/autor/</span>
            <input
              type="text"
              name="slug"
              value={form.slug}
              onChange={handleChange}
              placeholder="maria-ionescu"
              pattern="[a-z0-9-]*"
              title="Doar litere mici, cifre și cratime"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">Doar litere mici, cifre și cratime. Generat automat din nume dacă lăsați gol.</p>
        </div>

        {/* Title / Credentials */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Briefcase className="inline w-4 h-4 mr-1 mb-0.5" />
            Titlu / Calificare
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Ex: Medic veterinar, Crescător autorizat"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <p className="mt-1 text-xs text-gray-400">Afișat ca sub-titlu pe pagina de autor și în byline-ul articolelor.</p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FileText className="inline w-4 h-4 mr-1 mb-0.5" />
            Biografie scurtă
          </label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={3}
            maxLength={500}
            placeholder="1–2 fraze despre experiența și calificările tale."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
          <p className="mt-1 text-xs text-gray-400">{form.bio.length}/500 caractere</p>
        </div>

        {/* Photo URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Camera className="inline w-4 h-4 mr-1 mb-0.5" />
            URL fotografie
          </label>
          <input
            type="url"
            name="photo"
            value={form.photo}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <p className="mt-1 text-xs text-gray-400">Introduceți URL-ul imaginii. Puteți urca o poză în Media și copia URL-ul.</p>
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Globe className="inline w-4 h-4 mr-1 mb-0.5" />
            Website / LinkedIn
          </label>
          <input
            type="url"
            name="website"
            value={form.website}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Se salvează...' : 'Salvează profilul'}
        </button>
      </form>

      <div className="mt-4 p-4 bg-gray-50 rounded-xl text-xs text-gray-500 space-y-1">
        <p><strong>Cont:</strong> {profile?.email}</p>
        <p><strong>Rol:</strong> {profile?.role}</p>
      </div>
    </div>
  )
}
