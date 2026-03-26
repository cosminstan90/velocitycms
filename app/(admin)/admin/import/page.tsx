'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

type Step = 'upload' | 'options' | 'import' | 'results'

interface Counts {
  posts: number
  pages: number
  categories: number
  oldDomain: string | null
}

interface Options {
  importPosts: boolean
  importPages: boolean
  importMedia: boolean
  importCategories: boolean
  redownloadMedia: boolean
  oldDomain: string
  newDomain: string
}

interface ProgressEvent {
  step: string
  current: number
  total: number
  percent: number
  message: string
}

interface Result {
  categoriesImported: number
  postsImported: number
  pagesImported: number
  mediaDownloaded: number
  errors: string[]
  duplicates: number
  skipped: number
}

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [counts, setCounts] = useState<Counts | null>(null)
  const [options, setOptions] = useState<Options>({
    importPosts: true,
    importPages: true,
    importMedia: true,
    importCategories: true,
    redownloadMedia: false,
    oldDomain: '',
    newDomain: '',
  })
  const [progress, setProgress] = useState<ProgressEvent | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setCounts(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const parseFile = async () => {
    if (!file) return

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('parseOnly', 'true')

    try {
      const response = await fetch('/api/import/wordpress', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (data.error) {
        alert(data.error)
      } else {
        setCounts(data)
        setOptions(prev => ({ ...prev, oldDomain: data.oldDomain || '' }))
        setStep('options')
      }
    } catch (error) {
      alert('Error parsing file')
    }
    setLoading(false)
  }

  const startImport = async () => {
    if (!file) return

    setStep('import')
    setLogs([])
    setProgress(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('options', JSON.stringify(options))

    const response = await fetch('/api/import/wordpress', {
      method: 'POST',
      body: formData,
    })

    const reader = response.body?.getReader()
    if (!reader) return

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.step === 'completed') {
              setResult(data)
              setStep('results')
            } else if (data.step === 'error') {
              alert(data.message)
            } else {
              setProgress(data)
              setLogs(prev => [...prev.slice(-19), data.message])
            }
          } catch {}
        }
      }
    }
  }

  useEffect(() => {
    if (step === 'options') {
      fetch('/api/seo-settings')
        .then(res => res.json())
        .then(data => {
          if (data.siteUrl) {
            setOptions(prev => ({ ...prev, newDomain: data.siteUrl }))
          }
        })
        .catch(() => {})
    }
  }, [step])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Import WordPress</h1>

      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Upload WordPress Export</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div>
                  <p className="text-lg font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg">Drop your WordPress export XML file here</p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xml"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
            </div>
            {file && (
              <Button onClick={parseFile} disabled={loading} className="mt-4">
                {loading ? 'Parsing...' : 'Parse & Preview'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'options' && counts && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Import Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Badge variant="secondary">{counts.posts} Posts</Badge>
              <Badge variant="secondary">{counts.pages} Pages</Badge>
              <Badge variant="secondary">{counts.categories} Categories</Badge>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Checkbox
                  checked={options.importPosts}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, importPosts: !!checked }))}
                />
                <span>Import Posts</span>
              </Label>
              <Label className="flex items-center space-x-2">
                <Checkbox
                  checked={options.importPages}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, importPages: !!checked }))}
                />
                <span>Import Pages</span>
              </Label>
              <Label className="flex items-center space-x-2">
                <Checkbox
                  checked={options.importCategories}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, importCategories: !!checked }))}
                />
                <span>Import Categories</span>
              </Label>
              <Label className="flex items-center space-x-2">
                <Checkbox
                  checked={options.redownloadMedia}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, redownloadMedia: !!checked }))}
                />
                <span>Re-download Media (slower, but ensures images are local)</span>
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="oldDomain">Old Domain</Label>
                <Input
                  id="oldDomain"
                  value={options.oldDomain}
                  onChange={(e) => setOptions(prev => ({ ...prev, oldDomain: e.target.value }))}
                  placeholder="https://old-site.com"
                />
              </div>
              <div>
                <Label htmlFor="newDomain">New Domain</Label>
                <Input
                  id="newDomain"
                  value={options.newDomain}
                  onChange={(e) => setOptions(prev => ({ ...prev, newDomain: e.target.value }))}
                  placeholder="https://new-site.com"
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={() => setStep('upload')}>Back</Button>
              <Button onClick={startImport}>Start Import</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'import' && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Importing...</CardTitle>
          </CardHeader>
          <CardContent>
            {progress && (
              <div className="space-y-4">
                <div>
                  <p className="font-medium">{progress.step}</p>
                  <Progress value={progress.percent} />
                  <p className="text-sm text-gray-500">{progress.current} / {progress.total}</p>
                </div>
                <div className="bg-gray-100 p-4 rounded max-h-40 overflow-y-auto">
                  {logs.map((log, i) => (
                    <p key={i} className="text-sm">{log}</p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'results' && result && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Import Complete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Posts Imported</p>
                <p className="text-2xl">{result.postsImported}</p>
              </div>
              <div>
                <p className="font-medium">Pages Imported</p>
                <p className="text-2xl">{result.pagesImported}</p>
              </div>
              <div>
                <p className="font-medium">Categories Imported</p>
                <p className="text-2xl">{result.categoriesImported}</p>
              </div>
              <div>
                <p className="font-medium">Media Downloaded</p>
                <p className="text-2xl">{result.mediaDownloaded}</p>
              </div>
            </div>

            {(result.duplicates > 0 || result.skipped > 0) && (
              <Alert>
                <AlertDescription>
                  Duplicates: {result.duplicates}, Skipped: {result.skipped}
                </AlertDescription>
              </Alert>
            )}

            {result.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <details>
                    <summary>Errors ({result.errors.length})</summary>
                    <ul className="mt-2">
                      {result.errors.map((error, i) => (
                        <li key={i} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </details>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-2">
              <Button onClick={() => window.location.reload()}>New Import</Button>
              <Button onClick={() => window.location.href = '/admin/posts'}>Go to Posts</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}