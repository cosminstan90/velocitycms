'use client'

import { Extension } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import { Suggestion, type SuggestionOptions } from '@tiptap/suggestion'
import {
  forwardRef, useEffect, useImperativeHandle, useState, useCallback,
} from 'react'
import tippy, { type Instance as TippyInstance } from 'tippy.js'
import {
  Heading1, Heading2, Heading3, List, ListOrdered, Quote,
  Code2, Image, Table, HelpCircle, Workflow, BarChart2,
  Star, AlertCircle, AlignLeft,
} from 'lucide-react'

export interface CommandItem {
  title: string
  description: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  command: (props: { editor: any; range: any }) => void
}

const COMMANDS: CommandItem[] = [
  {
    title: 'Paragraf', description: 'Text normal',
    icon: AlignLeft,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: 'Titlu 1', description: 'Titlu mare H1',
    icon: Heading1,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
  },
  {
    title: 'Titlu 2', description: 'Subtitlu H2',
    icon: Heading2,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
  },
  {
    title: 'Titlu 3', description: 'Subtitlu mic H3',
    icon: Heading3,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
  },
  {
    title: 'Listă simplă', description: 'Listă cu puncte',
    icon: List,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: 'Listă numerotată', description: 'Listă cu numere',
    icon: ListOrdered,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: 'Citat', description: 'Bloc citat',
    icon: Quote,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: 'Cod', description: 'Bloc de cod',
    icon: Code2,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: 'FAQ', description: 'Bloc Întrebări Frecvente',
    icon: HelpCircle,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertFAQBlock().run(),
  },
  {
    title: 'HowTo', description: 'Ghid pas cu pas',
    icon: Workflow,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertHowTo().run(),
  },
  {
    title: 'Comparație', description: 'Tabel comparativ',
    icon: BarChart2,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertComparison().run(),
  },
  {
    title: 'Recenzie', description: 'Bloc recenzie cu rating',
    icon: Star,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertReview().run(),
  },
  {
    title: 'Callout Info', description: 'Notă informativă albastră',
    icon: AlertCircle,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertCallout('info').run(),
  },
  {
    title: 'Callout Atenție', description: 'Avertisment galben',
    icon: AlertCircle,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertCallout('warning').run(),
  },
  {
    title: 'Imagine', description: 'Inserează imagine din bibliotecă media',
    icon: Image,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run()
      document.dispatchEvent(new CustomEvent('tiptap:open-image-picker'))
    },
  },
]

// ─── Command List Component ───────────────────────────────────────────────────

interface CommandListProps {
  items: CommandItem[]
  command: (item: CommandItem) => void
}

export const CommandList = forwardRef<{ onKeyDown: (e: KeyboardEvent) => boolean }, CommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index]
        if (item) command(item)
      },
      [items, command]
    )

    useEffect(() => { setSelectedIndex(0) }, [items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ key }: KeyboardEvent) => {
        if (key === 'ArrowUp') { setSelectedIndex((i) => (i + items.length - 1) % items.length); return true }
        if (key === 'ArrowDown') { setSelectedIndex((i) => (i + 1) % items.length); return true }
        if (key === 'Enter') { selectItem(selectedIndex); return true }
        return false
      },
    }))

    if (!items.length) return null

    return (
      <div
        className="slash-menu rounded-xl border border-slate-600 shadow-2xl overflow-hidden py-1 z-50"
        style={{ backgroundColor: '#1e293b', minWidth: 240, maxHeight: 320, overflowY: 'auto' }}
      >
        {items.map((item, i) => (
          <button
            key={item.title}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition ${
              i === selectedIndex ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
            }`}
            onClick={() => selectItem(i)}
          >
            <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
              i === selectedIndex ? 'bg-blue-500' : 'bg-slate-700'
            }`}>
              <item.icon size={14} />
            </div>
            <div>
              <p className="text-sm font-medium leading-none">{item.title}</p>
              <p className={`text-xs mt-0.5 ${i === selectedIndex ? 'text-blue-200' : 'text-slate-500'}`}>
                {item.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    )
  }
)
CommandList.displayName = 'CommandList'

// ─── Extension ────────────────────────────────────────────────────────────────

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return { suggestion: {} as Partial<SuggestionOptions> }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        command: ({ editor, range, props }: { editor: any; range: any; props: any }) => {
          props.command({ editor, range })
        },
        items: ({ query }: { query: string }) => {
          const q = query.toLowerCase()
          return COMMANDS.filter((item) => item.title.toLowerCase().includes(q))
        },
        render: () => {
          let component: ReactRenderer | null = null
          let popup: TippyInstance[] | null = null

          return {
            onStart(props: any) {
              component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
              })
              popup = tippy('body', {
                getReferenceClientRect: props.clientRect as any,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              })
            },
            onUpdate(props: any) {
              component?.updateProps(props)
              popup?.[0]?.setProps({ getReferenceClientRect: props.clientRect as any })
            },
            onKeyDown(props: any) {
              if (props.event.key === 'Escape') { popup?.[0]?.hide(); return true }
              return (component?.ref as any)?.onKeyDown(props.event) ?? false
            },
            onExit() {
              popup?.[0]?.destroy()
              component?.destroy()
            },
          }
        },
        ...this.options.suggestion,
      }),
    ]
  },
})
