import React from 'react';

export enum HighlightCategory {
  IMPORTANT = 'IMPORTANT',
  FACT = 'FACT',
  ACTION = 'ACTION',
  WARNING = 'WARNING',
  CUSTOM = 'CUSTOM'
}

export interface Highlight {
  id: string;
  text: string;
  category: HighlightCategory;
  startIndex: number;
  endIndex: number;
  note?: string;
}

export interface ProcessingState {
  isAnalyzing: boolean;
  error: string | null;
}

export interface ThemeColors {
  color: string;
  bgColor: string;
  borderColor: string;
}

export type ThemePalette = Record<HighlightCategory, ThemeColors>;

export interface ModeMetadata {
  id: HighlightCategory;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface SavedDocument {
  id: string;
  text: string;
  highlights: Highlight[];
  summary?: string;
  chatHistory: ChatMessage[];
  lastModified: number;
}