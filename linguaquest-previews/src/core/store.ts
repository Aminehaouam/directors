import { useCallback, useMemo, useReducer } from 'react';
import { buildModel, initialState, reducer, type Action, type PreviewModel, type PreviewState } from './model';
import { DESIGN_IDS, type DesignId } from './types';

type Store = Record<DesignId, PreviewState>;

type StoreAction =
  | { type: 'one'; design: DesignId; action: Action }
  | { type: 'all'; action: Action }
  | { type: 'align'; from: DesignId }
  | { type: 'resetAll' };

const freshStore = (): Store =>
  Object.fromEntries(DESIGN_IDS.map((id) => [id, initialState])) as Store;

function storeReducer(store: Store, a: StoreAction): Store {
  switch (a.type) {
    case 'one':
      return { ...store, [a.design]: reducer(store[a.design], a.action) };
    case 'all':
      return Object.fromEntries(DESIGN_IDS.map((id) => [id, reducer(store[id], a.action)])) as Store;
    case 'align':
      return Object.fromEntries(DESIGN_IDS.map((id) => [id, store[a.from]])) as Store;
    case 'resetAll':
      return freshStore();
  }
}

/**
 * One independent prototype state per direction. When `linked` is true every
 * interaction is mirrored to all four phones, so the same screen can be
 * compared side by side.
 */
export function usePreviewStore(linked: boolean) {
  const [store, dispatch] = useReducer(storeReducer, undefined, freshStore);

  const models = useMemo(() => {
    const out = {} as Record<DesignId, PreviewModel>;
    for (const id of DESIGN_IDS) {
      out[id] = buildModel(store[id], (action) =>
        dispatch(linked ? { type: 'all', action } : { type: 'one', design: id, action }),
      );
    }
    return out;
  }, [store, linked]);

  const align = useCallback((from: DesignId) => dispatch({ type: 'align', from }), []);
  const resetAll = useCallback(() => dispatch({ type: 'resetAll' }), []);

  return { models, align, resetAll };
}
