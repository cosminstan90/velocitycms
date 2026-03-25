'use client'

import { useEffect, useState } from 'react'

type PostType = 'POST' | 'PAGE'

type FieldType = 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'SELECT' | 'BOOLEAN' | 'DATE' | 'URL'

interface FieldDefinition {
  id: string
  siteId: string
  postType: PostType
  fieldKey: string
  fieldLabel: string
  fieldType: FieldType
  fieldOptions?: string | null
  isRequired: boolean
  showInSchema: boolean
  schemaProperty?: string | null
  sortOrder: number
}

const fieldTypeDescriptions: Record<FieldType, string> = {
  TEXT: 'Single line text',
  TEXTAREA: 'Multi-line text',
  NUMBER: 'Numeric value',
  SELECT: 'Dropdown select',
  BOOLEAN: 'True/False',
  DATE: 'Date picker',
  URL: 'URL input',
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function CustomFieldsSettingsPage() {
  const [tab, setTab] = useState<PostType>('POST')
  const [defs, setDefs] = useState<FieldDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FieldDefinition | null>(null)

  const [form, setForm] = useState({
    fieldLabel: '',
    fieldKey: '',
    fieldType: 'TEXT' as FieldType,
    fieldOptions: '',
    isRequired: false,
    showInSchema: false,
    schemaProperty: '',
  })

  useEffect(() => {
    loadDefinitions()
  }, [tab])

  const loadDefinitions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/field-definitions?siteId=localhost&postType=${tab}`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setDefs((data.fieldDefinitions ?? []).sort((a:any,b:any)=>a.sortOrder-b.sortOrder))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare de încărcare')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ fieldLabel: '', fieldKey: '', fieldType: 'TEXT', fieldOptions: '', isRequired: false, showInSchema: false, schemaProperty: '' })
    setModalOpen(true)
  }

  const startEdit = (def: FieldDefinition) => {
    setEditing(def)
    setForm({
      fieldLabel: def.fieldLabel,
      fieldKey: def.fieldKey,
      fieldType: def.fieldType,
      fieldOptions: def.fieldOptions ?? '',
      isRequired: def.isRequired,
      showInSchema: def.showInSchema,
      schemaProperty: def.schemaProperty ?? '',
    })
    setModalOpen(true)
  }

  const saveFieldDef = async () => {
    try {
      const body: any = {
        siteId: 'localhost',
        postType: tab,
        fieldLabel: form.fieldLabel,
        fieldKey: form.fieldKey || slugify(form.fieldLabel),
        fieldType: form.fieldType,
        isRequired: form.isRequired,
        showInSchema: form.showInSchema,
        schemaProperty: form.schemaProperty || null,
      }
      if (form.fieldType === 'SELECT') {
        const options = form.fieldOptions
          .split('\n')
          .map((ln) => ln.trim())
          .filter(Boolean)
          .map((line) => {
            const [value, label] = line.split(':').map((i) => i.trim())
            return { value, label: label || value }
          })
        body.fieldOptions = options
      }

      let res
      if (editing) {
        res = await fetch(`/api/field-definitions/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/field-definitions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      if (!res.ok) throw new Error(await res.text())
      await loadDefinitions()
      setModalOpen(false)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Eroare de salvat')
    }
  }

  const deleteFieldDef = async (id: string) => {
    if (!confirm('Ștergeți acest câmp?')) return
    const res = await fetch(`/api/field-definitions/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      alert(err?.error ?? 'Nu s-a putut șterge')
      return
    }
    await loadDefinitions()
  }

  const reorder = async (sourceIndex: number, destinationIndex: number) => {
    if (sourceIndex === destinationIndex) return
    const next = [...defs]
    const [moved] = next.splice(sourceIndex, 1)
    next.splice(destinationIndex, 0, moved)
    setDefs(next)

    await fetch('/api/field-definitions/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: next.map((d) => d.id) }),
    })
  }

  return (
    <div className='p-6 space-y-4'>
      <h1 className='text-xl font-bold'>Câmpuri custom</h1>

      <div className='flex gap-3'>
        <button className={`px-3 py-2 rounded ${tab === 'POST' ? 'bg-blue-600 text-white' : 'bg-slate-800'}`} onClick={() => setTab('POST')}>Articole</button>
        <button className={`px-3 py-2 rounded ${tab === 'PAGE' ? 'bg-blue-600 text-white' : 'bg-slate-800'}`} onClick={() => setTab('PAGE')}>Pagini</button>
      </div>

      <div className='flex justify-between items-center'>
        <h2 className='font-semibold'>{tab === 'POST' ? 'Campos de Articole' : 'Câmpuri Pagini'}</h2>
        <button onClick={openCreate} className='px-3 py-2 rounded bg-green-600 text-white'>Adaugă câmp</button>
      </div>

      {loading && <p>Se încarcă...</p>}
      {error && <p className='text-rose-400'>{error}</p>}

      {!loading && !defs.length && <p className='text-slate-500'>Nu există câmpuri definite.</p>}

      <div className='space-y-2'>
        {defs.map((def, idx) => (
          <div
            key={def.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', String(idx))}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const source = Number(e.dataTransfer.getData('text/plain'))
              reorder(source, idx)
            }}
            className='p-3 border border-slate-700 rounded-lg bg-[#0f172a] flex items-center justify-between gap-2'
          >
            <div>
              <div className='font-semibold'>{def.fieldLabel} <span className='text-xs text-slate-500'>{def.fieldKey}</span></div>
              <div className='text-xs text-slate-400'>{def.fieldType} {def.isRequired ? '• Required' : ''} {def.showInSchema ? '• Schema' : ''}</div>
            </div>
            <div className='flex items-center gap-1'>
              <button onClick={() => startEdit(def)} className='text-blue-400 text-xs px-2 py-1 rounded border border-blue-500'>Edit</button>
              <button onClick={() => deleteFieldDef(def.id)} className='text-rose-400 text-xs px-2 py-1 rounded border border-rose-500'>Șterge</button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50'>
          <div className='bg-[#0b1220] border border-slate-600 rounded-xl p-5 w-full max-w-2xl'>
            <h3 className='text-lg font-semibold mb-3'>{editing ? 'Editează câmp' : 'Adaugă câmp nou'}</h3>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='text-xs text-slate-400'>Etichetă</label>
                <input value={form.fieldLabel} onChange={(e) => {
                  setForm((s) => ({ ...s, fieldLabel: e.target.value, fieldKey: s.fieldKey || slugify(e.target.value) }))
                }} className='mt-1 w-full rounded bg-[#0f172a] border border-slate-700 p-2 text-sm' />
              </div>
              <div>
                <label className='text-xs text-slate-400'>Cheie</label>
                <input value={form.fieldKey} onChange={(e) => setForm((s) => ({ ...s, fieldKey: slugify(e.target.value) }))} className='mt-1 w-full rounded bg-[#0f172a] border border-slate-700 p-2 text-sm' />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3 mt-3'>
              <div>
                <label className='text-xs text-slate-400'>Tip</label>
                <select value={form.fieldType} onChange={(e) => setForm((s) => ({ ...s, fieldType: e.target.value as FieldType }))} className='mt-1 w-full rounded bg-[#0f172a] border border-slate-700 p-2 text-sm'>
                  {Object.keys(fieldTypeDescriptions).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <p className='text-xs text-slate-500 mt-1'>{fieldTypeDescriptions[form.fieldType]}</p>
              </div>
              <div className='flex items-end gap-2'>
                <label className='text-xs text-slate-400'>Obligatoriu</label>
                <input type='checkbox' checked={form.isRequired} onChange={(e) => setForm((s) => ({ ...s, isRequired: e.target.checked }))} className='h-4 w-4' />
              </div>
            </div>

            {form.fieldType === 'SELECT' && (
              <div className='mt-3'>
                <label className='text-xs text-slate-400'>Opțiuni (o pe linie, value:label)</label>
                <textarea value={form.fieldOptions} onChange={(e) => setForm((s) => ({ ...s, fieldOptions: e.target.value }))} className='mt-1 w-full rounded bg-[#0f172a] border border-slate-700 p-2 text-sm h-24' />
              </div>
            )}

            <div className='mt-3 grid grid-cols-2 gap-3'>
              <label className='text-xs text-slate-400'>Include în schema</label>
              <input type='checkbox' checked={form.showInSchema} onChange={(e) => setForm((s) => ({ ...s, showInSchema: e.target.checked }))} />
            </div>
            {form.showInSchema && (
              <div className='mt-3'>
                <label className='text-xs text-slate-400'>Proprietate schema</label>
                <input value={form.schemaProperty} onChange={(e) => setForm((s) => ({ ...s, schemaProperty: e.target.value }))} className='mt-1 w-full rounded bg-[#0f172a] border border-slate-700 p-2 text-sm' placeholder='breed, weight, height' />
              </div>
            )}

            <div className='mt-4 flex justify-end gap-2'>
              <button className='px-3 py-2 rounded bg-slate-700 border border-slate-600' onClick={() => setModalOpen(false)}>Anulează</button>
              <button className='px-3 py-2 rounded bg-blue-600 text-white' onClick={saveFieldDef}>Salvează</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
