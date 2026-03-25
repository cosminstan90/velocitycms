import { Node, mergeAttributes } from '@tiptap/core'

export type CalloutType = 'info' | 'warning' | 'success' | 'danger'

const CALLOUT_STYLES: Record<CalloutType, { border: string; bg: string; label: string; icon: string }> = {
  info:    { border: '#3b82f6', bg: 'rgba(59,130,246,0.08)',   label: 'Info',      icon: 'ℹ️' },
  warning: { border: '#f59e0b', bg: 'rgba(245,158,11,0.08)',   label: 'Atenție',   icon: '⚠️' },
  success: { border: '#22c55e', bg: 'rgba(34,197,94,0.08)',    label: 'Succes',    icon: '✅' },
  danger:  { border: '#ef4444', bg: 'rgba(239,68,68,0.08)',    label: 'Pericol',   icon: '🚨' },
}

export const CalloutBlock = Node.create({
  name: 'calloutBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      type:    { default: 'info' as CalloutType },
      content: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'aside[data-type="callout"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const style = CALLOUT_STYLES[HTMLAttributes.type as CalloutType] ?? CALLOUT_STYLES.info
    return [
      'aside',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'callout',
        style: `border-left:4px solid ${style.border};background:${style.bg};padding:12px 16px;border-radius:6px;margin:16px 0;`,
        class: `callout callout-${HTMLAttributes.type}`,
      }),
      ['span', { style: 'font-weight:600;' }, `${style.icon} ${style.label}: `],
      HTMLAttributes.content,
    ]
  },

  addCommands() {
    return {
      insertCallout:
        (type: CalloutType = 'info') =>
        ({ commands }: any) =>
          commands.insertContent({ type: 'calloutBlock', attrs: { type, content: '' } }),
    } as any
  },
})
