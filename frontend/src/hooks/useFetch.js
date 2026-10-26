import { useCallback, useEffect, useState } from 'react';

// Runs `loader()` when the component mounts and whenever `deps` change.
// Gives back the three states every data screen needs: loading, error, data.
export default function useFetch(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  const run = useCallback(() => {
    let cancelled = false; // ignore the result if the component moved on (avoids stale updates)
    setState((s) => ({ ...s, loading: true, error: null }));
    loader()
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((error) => !cancelled && setState({ data: null, loading: false, error }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => run(), [run]);

  const setData = (updater) =>
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }));

  return { ...state, reload: run, setData };
}
