import { useCallback, useEffect, useState } from 'react';
import { DESIGN_IDS, type DesignId } from '../core/types';

export type View = 'focus' | 'compare';
export interface Route {
  view: View;
  design: DesignId;
}

const isDesign = (s: string): s is DesignId => (DESIGN_IDS as readonly string[]).includes(s);

/** Plain names only (#pixel, #compare) so links survive hosts that strip paths from the hash. */
function parse(hash: string, fallback: Route): Route {
  const name = hash.replace(/^#\/?/, '');
  if (name === 'compare') return { view: 'compare', design: fallback.design };
  if (isDesign(name)) return { view: 'focus', design: name };
  return fallback;
}

/** Keeps the current view in the URL hash so a view can be linked to directly. */
export function useHashRoute(initial: DesignId) {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash, { view: 'focus', design: initial }));

  useEffect(() => {
    const onHash = () => setRoute((prev) => parse(window.location.hash, prev));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((next: Route) => {
    const hash = next.view === 'compare' ? '#compare' : `#${next.design}`;
    try {
      if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
    } catch {
      // Sandboxed frames may refuse history access; the in-memory route still updates.
    }
    setRoute(next);
  }, []);

  return [route, navigate] as const;
}
