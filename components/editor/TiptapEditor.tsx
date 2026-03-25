'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import { generateHTML } from '@tiptap/core'
import { useCallback, useEffect, useState } from 'react'
import MediaPicker, { type MediaItem } from '@/components/media/MediaPicker'
import {
  Bold, Italic, UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Code2,
  Link2, ImageIcon, TableIcon,
  Undo2, Redo2, MoreHorizontal,
  ChevronDown, Plus, Minus,
} from 'lucide-react'

import { FAQBlock } from './blocks/FAQBlock'
import { HowToBlock } from './blocks/HowToBlock'
import { ComparisonBlock } from './blocks/ComparisonBlock'
import { ReviewBlock } from './blocks/ReviewBlock'
import { CalloutBlock } from './blocks/CalloutBlock'
import { SlashCommands } from './SlashCommands'
import BlockNodeView from './BlockNodeView'

export type EditorOutput = {
  contentJson: Record<string, unknown>
  contentHtml: string
  characterCount: number
  wordCount: number
}

interface Props {
  initialJson?: Record<string, unknown>
  initialHtml?: string
  placeholder?: string
  onChange?: (output: EditorOutput) => void
  onImageUpload?: (file: File) => Promise<string>
  readOnly?: boolean
}

// Extend Image to persist width/height/loading from media library
const ExtendedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null },
      height: { default: null },
      loading: { default: null },
    }
  },
})

const ALL_EXTENSIONS = [
  StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
  Underline,
  Highlight.configure({ multicolor: false }),
  ExtendedImage.configure({ allowBase64: true, inline: false }),
  Link.configure({ openOnClick: false, autolink: true, defaultProtocol: 'https' }),
  Table.configure({ resizable: false }),
  TableRow,
  TableHeader,
  TableCell,
  Typography,
  CharacterCount,
  FAQBlock,
  HowToBlock,
  ComparisonBlock,
  ReviewBlock,
  CalloutBlock,
]

function ToolbarDivider() {
  return <div className="w-px h-5 bg-slate-600 mx-1" />
}

function ToolbarBtn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition text-sm ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-slate-300 hover:bg-slate-600 hover:text-white'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  )
}

export default function TiptapEditor({
  initialJson,
  placeholder = 'Începe să scrii... (/ pentru blocuri)',
  onChange,
  onImageUpload,
  readOnly = false,
}: Props) {
  const [showMediaPicker, setShowMediaPicker] = useState(false)

  // Listen for the slash command requesting the picker
  useEffect(() => {
    const handler = () => setShowMediaPicker(true)
    document.addEventListener('tiptap:open-image-picker', handler)
    return () => document.removeEventListener('tiptap:open-image-picker', handler)
  }, [])

  const editor = useEditor({
    extensions: [
      ...ALL_EXTENSIONS,
      Placeholder.configure({ placeholder }),
      SlashCommands,
    ],
    content: initialJson ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[400px] px-1 py-2',
      },
    },
    onUpdate({ editor }) {
      if (!onChange) return
      const json = editor.getJSON()
      const html = editor.getHTML()
      onChange({
        contentJson: json as Record<string, unknown>,
        contentHtml: html,
        characterCount: editor.storage.characterCount?.characters() ?? 0,
        wordCount: editor.storage.characterCount?.words() ?? 0,
      })
    },
  })

  // Listen for internal-link insertion requests from InternalLinksPanel
  useEffect(() => {
    if (!editor) return

    const handler = (e: Event) => {
      const { anchorText, href } = (e as CustomEvent).detail as {
        anchorText: string
        href: string
        context: string
      }

      let inserted = false

      // Walk ProseMirror document nodes looking for the anchor text
      editor.state.doc.descendants((node, pos) => {
        if (inserted) return false
        if (node.isText && node.text && node.text.includes(anchorText)) {
          const idx = node.text.indexOf(anchorText)
          const from = pos + idx
          const to = from + anchorText.length
          editor
            .chain()
            .focus()
            .setTextSelection({ from, to })
            .setLink({ href, target: '_self' })
            .run()
          inserted = true
          return false
        }
      })

      document.dispatchEvent(
        new CustomEvent('tiptap:insert-link-result', { detail: { success: inserted } })
      )
    }

    document.addEventListener('tiptap:insert-link', handler)
    return () => document.removeEventListener('tiptap:insert-link', handler)
  }, [editor])

  const handlePickerSelect = useCallback(
    (item: MediaItem) => {
      if (!editor) return
      setShowMediaPicker(false)
      editor.chain().focus().setImage({
        src: item.url,
        alt: item.altText ?? item.originalName,
        width: item.width ?? undefined,
        height: item.height ?? undefined,
      }).run()
    },
    [editor]
  )

  const handleLinkInsert = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes('link').href ?? ''
    const url = window.prompt('URL:', prev)
    if (url === null) return
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run()
  }, [editor])

  const handleTableInsert = useCallback(() => {
    if (!editor) return
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  if (!editor) return null

  const chars = editor.storage.characterCount?.characters() ?? 0
  const words = editor.storage.characterCount?.words() ?? 0

  return (
    <div className="flex flex-col rounded-xl border border-slate-700 overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-slate-700" style={{ backgroundColor: '#0f172a' }}>
          {/* History */}
          <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
            <Undo2 size={15} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)">
            <Redo2 size={15} />
          </ToolbarBtn>

          <ToolbarDivider />

          {/* Inline marks */}
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
            <Bold size={15} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
            <Italic size={15} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
            <UnderlineIcon size={15} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
            <Strikethrough size={15} />
          </ToolbarBtn>

          <ToolbarDivider />

          {/* Headings */}
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
            <Heading1 size={15} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
            <Heading2 size={15} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
            <Heading3 size={15} />
          </ToolbarBtn>

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
            <List size={15} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
            <ListOrdered size={15} />
          </ToolbarBtn>

          <ToolbarDivider />

          {/* Blocks */}
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
            <Quote size={15} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">
            <Code size={15} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
            <Code2 size={15} />
          </ToolbarBtn>

          <ToolbarDivider />

          {/* Media & Structure */}
          <ToolbarBtn onClick={handleLinkInsert} active={editor.isActive('link')} title="Insert Link">
            <Link2 size={15} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => setShowMediaPicker(true)} title="Insert Image from Media Library">
            <ImageIcon size={15} />
          </ToolbarBtn>
          <ToolbarBtn onClick={handleTableInsert} active={editor.isActive('table')} title="Insert Table">
            <TableIcon size={15} />
          </ToolbarBtn>

          {/* Table controls (visible when in table) */}
          {editor.isActive('table') && (
            <>
              <ToolbarDivider />
              <ToolbarBtn onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row">
                <Plus size={13} />R
              </ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column">
                <Plus size={13} />C
              </ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row">
                <Minus size={13} />R
              </ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column">
                <Minus size={13} />C
              </ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table">
                <TableIcon size={13} className="text-red-400" />
              </ToolbarBtn>
            </>
          )}

          <ToolbarDivider />

          {/* Custom blocks dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-slate-300 hover:bg-slate-600 hover:text-white transition"
            >
              <MoreHorizontal size={15} />
              <span>Blocuri</span>
              <ChevronDown size={12} />
            </button>
            <div className="absolute top-full left-0 mt-1 hidden group-focus-within:block group-hover:block z-50 rounded-xl border border-slate-600 shadow-xl py-1 min-w-44"
              style={{ backgroundColor: '#1e293b' }}>
              {[
                { label: '❓ FAQ', fn: () => (editor.chain().focus() as any).insertFAQBlock().run() },
                { label: '📋 HowTo', fn: () => (editor.chain().focus() as any).insertHowTo().run() },
                { label: '📊 Comparație', fn: () => (editor.chain().focus() as any).insertComparison().run() },
                { label: '⭐ Recenzie', fn: () => (editor.chain().focus() as any).insertReview().run() },
                { label: '💡 Callout Info', fn: () => (editor.chain().focus() as any).insertCallout('info').run() },
                { label: '⚠️ Callout Atenție', fn: () => (editor.chain().focus() as any).insertCallout('warning').run() },
                { label: '✅ Callout Succes', fn: () => (editor.chain().focus() as any).insertCallout('success').run() },
                { label: '🚨 Callout Pericol', fn: () => (editor.chain().focus() as any).insertCallout('danger').run() },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); item.fn() }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Bubble menu */}
      {!readOnly && (
        <BubbleMenu
          editor={editor}
          updateDelay={0}
          shouldShow={((p: any) => !p.editor.state.selection.empty) as any}
        >
          <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg border border-slate-600 shadow-xl"
            style={{ backgroundColor: '#1e293b' }}>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
              <Bold size={13} />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
              <Italic size={13} />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
              <UnderlineIcon size={13} />
            </ToolbarBtn>
            <ToolbarBtn onClick={handleLinkInsert} active={editor.isActive('link')} title="Link">
              <Link2 size={13} />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
              <span className="text-xs font-bold text-yellow-400">H</span>
            </ToolbarBtn>
          </div>
        </BubbleMenu>
      )}

      {/* Editor content */}
      <div className="px-4 py-3">
        <EditorContent editor={editor} />
      </div>

      {/* Footer: character / word count */}
      {!readOnly && (
        <div className="flex items-center justify-end gap-4 px-4 py-2 border-t border-slate-700 text-xs text-slate-500">
          <span>{words} cuvinte</span>
          <span>{chars} caractere</span>
        </div>
      )}

      {/* Media Picker modal */}
      {showMediaPicker && (
        <MediaPicker
          onSelect={handlePickerSelect}
          onClose={() => setShowMediaPicker(false)}
          filterType="image"
          title="Inserează imagine"
        />
      )}
    </div>
  )
}

// Re-export helper for generating HTML from JSON outside the editor
export { generateHTML, ALL_EXTENSIONS }
