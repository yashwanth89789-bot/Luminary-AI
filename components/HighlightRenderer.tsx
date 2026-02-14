import React, { useMemo } from 'react';
import { Highlight, ThemePalette } from '../types';
import { MODES } from '../constants';

interface HighlightRendererProps {
  text: string;
  highlights: Highlight[];
  palette: ThemePalette;
  onHighlightClick: (id: string) => void;
}

export const HighlightRenderer: React.FC<HighlightRendererProps> = ({ 
  text, 
  highlights, 
  palette,
  onHighlightClick 
}) => {
  
  const segments = useMemo(() => {
    const sortedHighlights = [...highlights].sort((a, b) => a.startIndex - b.startIndex);
    const result: React.ReactNode[] = [];
    let currentIndex = 0;

    sortedHighlights.forEach((highlight) => {
      // Push text before highlight
      if (highlight.startIndex > currentIndex) {
        result.push(
          <span key={`text-${currentIndex}`} className="text-gray-300">
            {text.slice(currentIndex, highlight.startIndex)}
          </span>
        );
      }

      // Push highlighted text
      const end = Math.min(highlight.endIndex, text.length);
      const start = Math.max(highlight.startIndex, 0);

      if (start < end) {
        const modeMeta = MODES[highlight.category];
        const colors = palette[highlight.category];
        
        result.push(
          <span
            key={highlight.id}
            id={`highlight-${highlight.id}`}
            onClick={() => onHighlightClick(highlight.id)}
            className={`
              cursor-pointer px-1 mx-0.5 rounded-md border-b-2
              transition-all duration-200 ease-in-out
              ${colors.color} ${colors.bgColor} ${colors.borderColor}
              hover:opacity-80 hover:scale-[1.02] inline-block
            `}
            title={modeMeta.label}
          >
            {text.slice(start, end)}
          </span>
        );
      }

      currentIndex = Math.max(currentIndex, end);
    });

    // Push remaining text
    if (currentIndex < text.length) {
      result.push(
        <span key={`text-end`} className="text-gray-300">
          {text.slice(currentIndex)}
        </span>
      );
    }

    return result;
  }, [text, highlights, palette, onHighlightClick]);

  return (
    <div className="whitespace-pre-wrap leading-relaxed font-sans text-lg">
      {segments}
    </div>
  );
};