import { useCallback, useEffect, useState, type UIEvent } from 'react';

/**
 * Tracks whether a scroll container has left the top, so a design can fade in
 * a backdrop behind the phone status bar. Resets when `resetKey` changes
 * (e.g. on tab switch, where the container remounts at the top).
 */
export function useScrolled(resetKey: unknown, threshold = 6) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => setScrolled(false), [resetKey]);
  const onScroll = useCallback(
    (e: UIEvent<HTMLElement>) => setScrolled(e.currentTarget.scrollTop > threshold),
    [threshold],
  );
  return { scrolled, onScroll };
}
