import { useEffect } from 'react';
import useDebounce from './useDebounce.js';

// Saves `value` to localStorage shortly after you stop typing, so a refresh or a dropped
// connection never loses your draft.
//   enabled  - false until the editor has finished loading (so the empty starting form
//              cannot overwrite a draft that is waiting to be restored)
//   baseline - what is already saved on the server; if the form equals it there is
//              nothing to protect, so the local copy is removed instead of stored
export default function useAutosaveDraft(key, value, enabled, baseline) {
  const debounced = useDebounce(value, 600);

  useEffect(() => {
    // Only act once the debounced copy has caught up with what is on screen.
    if (!enabled || debounced !== value) return;
    try {
      if (JSON.stringify(debounced) === JSON.stringify(baseline)) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), value: debounced }));
      }
    } catch {
      /* storage full or blocked: autosave is a bonus, never crash the editor */
    }
  }, [key, debounced, value, enabled, baseline]);

  return {
    load() {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
    clear() {
      localStorage.removeItem(key);
    },
  };
}
