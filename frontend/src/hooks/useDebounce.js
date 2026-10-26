import { useEffect, useState } from 'react';

// Returns `value`, but only after it has stopped changing for `delay` ms.
// Used by the search box so we call the API once you pause typing, not on every keystroke.
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // cleanup: cancel the old timer when value changes again
  }, [value, delay]);

  return debounced;
}
