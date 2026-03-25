'use client'

import { useEffect, useState } from 'react'

export type FieldDefinition = {
  id: string
  fieldKey: string
  fieldLabel: string
  fieldType: 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'SELECT' | 'BOOLEAN' | 'DATE' | 'URL'
  fieldOptions?: string | null
  isRequired: boolean
  showInSchema: boolean
  schemaProperty: string | null
  sortOrder: number
}

export type FieldValue = {
  id: string
  fieldDefinitionId: string
  value: string
  fieldDefinition: FieldDefinition
}

interface CustomFieldsPanelProps {
  postId: string
  siteId: string
  postType: 'POST' | 'PAGE'
  onChange?: (values: Record<string, string>) => void
  onValidationChange?: (missingFields: string[]) => void
}

export default function CustomFieldsPanel({ postId, siteId, postType, onChange, onValidationChange }: CustomFieldsPanelProps) {
  const [definitions, setDefinitions] = useState<FieldDefinition[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [defsRes, valuesRes] = await Promise.all([
          fetch(`/api/field-definitions?siteId=${siteId}&postType=${postType}`),
          fetch(`/api/${postType.toLowerCase()}s/${postId}/field-values`),
        ])

        if (!defsRes.ok) throw new Error(await defsRes.text())
        if (!valuesRes.ok) throw new Error(await valuesRes.text())

        const defsJson = await defsRes.json()
        const valuesJson = await valuesRes.json()

        if (!cancelled) {
          const defs = (defsJson.fieldDefinitions ?? []) as FieldDefinition[]
          const fieldValues = (valuesJson.fieldValues ?? []) as FieldValue[]
          setDefinitions(defs)
          const nextValues = fieldValues.reduce<Record<string, string>>((acc, item) => {
            acc[item.fieldDefinitionId] = item.value
            return acc
          }, {})
          setValues(nextValues)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unable to fetch custom fields')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [siteId, postId, postType])

  useEffect(() => {
    if (!definitions.length) {
      onValidationChange?.([])
      return
    }

    const missing = definitions
      .filter((d) => d.isRequired && !values[d.id]?.trim())
      .map((d) => d.fieldLabel)

    onValidationChange?.(missing)
    onChange?.(values)
  }, [definitions, values, onChange, onValidationChange])

  const handleChange = (defId: string, value: string) => {
    setValues((prev) => ({ ...prev, [defId]: value }))
  }

  const renderInput = (def: FieldDefinition, value: string) => {
    const commonClasses = 'w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500'
    switch (def.fieldType) {
      case 'TEXT':
      case 'URL':
        return (
          <input
            type={def.fieldType === 'URL' ? 'url' : 'text'}
            value={value}
            onChange={(e) => handleChange(def.id, e.target.value)}
            className={commonClasses}
          />
        )
      case 'TEXTAREA':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(def.id, e.target.value)}
            className={`${commonClasses} h-20 resize-y`}
          />
        )
      case 'NUMBER':
        return (
          <input
            type='number'
            value={value}
            onChange={(e) => handleChange(def.id, e.target.value)}
            className={commonClasses}
          />
        )
      case 'SELECT': {
        const options = def.fieldOptions ? JSON.parse(def.fieldOptions as string) : []
        return (
          <select
            value={value}
            onChange={(e) => handleChange(def.id, e.target.value)}
            className={commonClasses}
          >
            <option value=''>Selectează...</option>
            {Array.isArray(options) ? options.map((opt: any) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            )) : null}
          </select>
        )
      }
      case 'BOOLEAN':
        return (
          <label className='inline-flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              checked={value === 'true'}
              onChange={(e) => handleChange(def.id, String(e.target.checked))}
              className='h-4 w-4 rounded border-slate-600 bg-[#0f172a] text-blue-500'
            />
            Activ
          </label>
        )
      case 'DATE':
        return (
          <input
            type='date'
            value={value}
            onChange={(e) => handleChange(def.id, e.target.value)}
            className={commonClasses}
          />
        )
      default:
        return <div className='text-xs text-slate-400'>Tip necunoscut</div>
    }
  }

  if (loading) return <div>Se încarcă câmpurile personalizate...</div>
  if (error) return <div className='text-red-400'>{error}</div>

  if (!definitions.length) return <div className='text-slate-400 text-sm'>Nu există câmpuri personalizate adăugate.</div>

  return (
    <div className='space-y-4'>
      {definitions.map((def) => (
        <div key={def.id} className='rounded-xl border border-slate-700 bg-[#0f172a] p-3'>
          <div className='flex items-center justify-between gap-2 mb-1'>
            <div>
              <p className='text-sm font-semibold text-white'>{def.fieldLabel} {def.isRequired ? <span className='text-rose-400'>*</span> : null}</p>
              <p className='text-xs text-slate-500 font-mono'>{def.fieldKey}</p>
            </div>
            {def.showInSchema && <span className='text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300'>Schema</span>}
          </div>
          {renderInput(def, values[def.id] ?? '')}
          {def.fieldType === 'SELECT' && def.fieldOptions && (
            <p className='text-xs text-slate-500 mt-1'>Opțiuni: {def.fieldOptions}</p>
          )}
        </div>
      ))}
    </div>
  )
}
