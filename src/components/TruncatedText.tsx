import React, { useEffect, useRef, useState } from 'react';

interface TruncatedTextProps {
  text: string;
  lines?: number; // number of lines to show when collapsed
  className?: string;
  moreLabel?: string;
  lessLabel?: string;
}

export function TruncatedText({
  text,
  lines = 1,
  className = '',
  moreLabel = 'See more',
  lessLabel = 'See less',
}: TruncatedTextProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Set initial to full text and measure
    el.style.whiteSpace = 'normal';
    el.innerText = text;

    const lineHeight = parseFloat(getComputedStyle(el).lineHeight || '16');
    const maxHeight = lineHeight * lines;

    // Make sure DOM updates happened
    requestAnimationFrame(() => {
      if (el.scrollHeight > maxHeight + 1) {
        setIsTruncated(true);

        // perform a binary-search-ish truncate by words for a clean cut
        const words = text.split(/\s+/);
        let low = 0,
          high = words.length,
          best = low;
        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          el.innerText = words.slice(0, mid).join(' ') + '...';
          if (el.scrollHeight <= maxHeight + 1) {
            best = mid;
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }
        setDisplayText(words.slice(0, best).join(' ') + '...');
      } else {
        setIsTruncated(false);
        setDisplayText(text);
      }
    });
  }, [text, lines]);

  return (
    <div className={className}>
      <div ref={ref} aria-live="polite">
        {expanded ? text : displayText}
      </div>
      {isTruncated && (
        <button
          onClick={() => setExpanded((s) => !s)}
          className="ml-2 text-xs text-[#00A8FF]"
          aria-expanded={expanded}
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  );
}
