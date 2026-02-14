import React from 'react';
import { HighlightCategory, ModeMetadata, ThemePalette } from './types';
import { Sparkles, Info, CheckCircle, AlertTriangle, PenTool } from 'lucide-react';

export const MODES: Record<HighlightCategory, ModeMetadata> = {
  [HighlightCategory.IMPORTANT]: {
    id: HighlightCategory.IMPORTANT,
    label: 'Key Insight',
    icon: <Sparkles className="w-4 h-4" />,
    description: "Core ideas and main takeaways"
  },
  [HighlightCategory.FACT]: {
    id: HighlightCategory.FACT,
    label: 'Fact & Data',
    icon: <Info className="w-4 h-4" />,
    description: "Statistics, dates, and verifiable facts"
  },
  [HighlightCategory.ACTION]: {
    id: HighlightCategory.ACTION,
    label: 'Action Item',
    icon: <CheckCircle className="w-4 h-4" />,
    description: "Tasks, steps, and required actions"
  },
  [HighlightCategory.WARNING]: {
    id: HighlightCategory.WARNING,
    label: 'Critical',
    icon: <AlertTriangle className="w-4 h-4" />,
    description: "Risks, warnings, and limitations"
  },
  [HighlightCategory.CUSTOM]: {
    id: HighlightCategory.CUSTOM,
    label: 'User Highlight',
    icon: <PenTool className="w-4 h-4" />,
    description: "Manually selected text"
  }
};

export const PALETTES: Record<string, ThemePalette> = {
  'Neon': {
    [HighlightCategory.IMPORTANT]: { color: 'text-purple-300', bgColor: 'bg-purple-900/40', borderColor: 'border-purple-500/50' },
    [HighlightCategory.FACT]: { color: 'text-blue-300', bgColor: 'bg-blue-900/40', borderColor: 'border-blue-500/50' },
    [HighlightCategory.ACTION]: { color: 'text-emerald-300', bgColor: 'bg-emerald-900/40', borderColor: 'border-emerald-500/50' },
    [HighlightCategory.WARNING]: { color: 'text-rose-300', bgColor: 'bg-rose-900/40', borderColor: 'border-rose-500/50' },
    [HighlightCategory.CUSTOM]: { color: 'text-amber-300', bgColor: 'bg-amber-900/40', borderColor: 'border-amber-500/50' }
  },
  'Soft': {
    [HighlightCategory.IMPORTANT]: { color: 'text-indigo-200', bgColor: 'bg-indigo-900/30', borderColor: 'border-indigo-400/30' },
    [HighlightCategory.FACT]: { color: 'text-sky-200', bgColor: 'bg-sky-900/30', borderColor: 'border-sky-400/30' },
    [HighlightCategory.ACTION]: { color: 'text-teal-200', bgColor: 'bg-teal-900/30', borderColor: 'border-teal-400/30' },
    [HighlightCategory.WARNING]: { color: 'text-orange-200', bgColor: 'bg-orange-900/30', borderColor: 'border-orange-400/30' },
    [HighlightCategory.CUSTOM]: { color: 'text-yellow-100', bgColor: 'bg-yellow-900/30', borderColor: 'border-yellow-400/30' }
  },
  'Forest': {
    [HighlightCategory.IMPORTANT]: { color: 'text-lime-300', bgColor: 'bg-lime-900/40', borderColor: 'border-lime-500/50' },
    [HighlightCategory.FACT]: { color: 'text-green-300', bgColor: 'bg-green-900/40', borderColor: 'border-green-500/50' },
    [HighlightCategory.ACTION]: { color: 'text-emerald-300', bgColor: 'bg-emerald-900/40', borderColor: 'border-emerald-500/50' },
    [HighlightCategory.WARNING]: { color: 'text-amber-300', bgColor: 'bg-amber-900/40', borderColor: 'border-amber-500/50' },
    [HighlightCategory.CUSTOM]: { color: 'text-stone-300', bgColor: 'bg-stone-800/60', borderColor: 'border-stone-500/50' }
  }
};

export const INITIAL_TEXT = `Welcome to Luminary AI Highlighter.

Artificial Intelligence is reshaping how we process information. According to recent studies, AI tools can increase reading comprehension speed by up to 40% when key information is visually segmented.

Here are some things to try:
1. Paste a long article or email into this editor.
2. Click the "AI Analyze" button to automatically detect insights.
3. Review the sidebar to see your categorized knowledge.

Warning: Always verify AI-generated highlights for critical accuracy.

Enjoy exploring your text in a new light!`;