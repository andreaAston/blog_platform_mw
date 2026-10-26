import { useEffect, useRef } from 'react';

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', busy = false, onConfirm, onCancel }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !busy) onCancel();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [busy, onCancel]);

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <h2 id="confirm-dialog-title">{title}</h2>
        <p>{message}</p>
        <div className="actions-row">
          <button ref={cancelRef} type="button" className="btn btn-outline" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn danger-button" onClick={onConfirm} disabled={busy}>
            {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
