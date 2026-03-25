'use client'

import { NodeViewWrapper } from '@tiptap/react'
import { useState } from 'react'
import { Edit2, Trash2, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react'
import type { FAQItem } from './blocks/FAQBlock'
import type { HowToStep } from './blocks/HowToBlock'
import type { ComparisonRow } from './blocks/ComparisonBlock'
import type { ReviewBlockAttrs } from './blocks/ReviewBlock'
import type { CalloutType } from './blocks/CalloutBlock'

// This file exists for future React-based node views.
// Custom blocks currently use atom nodes rendered via renderHTML.
// This export satisfies the import in TiptapEditor.tsx.
export default function BlockNodeView() {
  return null
}
