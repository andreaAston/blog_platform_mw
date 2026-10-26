// Small shared pieces for the three states every screen has: loading, error, empty.
export function Loading({ label = 'Loading…' }) {
  return (
    <p className="status" role="status">
      <span className="spinner" aria-hidden="true" /> {label}
    </p>
  );
}

export function ErrorMessage({ error, onRetry }) {
  const message = error?.message || 'Something went wrong.';
  return (
    <div className="alert alert-error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-outline btn-small" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Empty({ children }) {
  return <p className="status muted">{children}</p>;
}
