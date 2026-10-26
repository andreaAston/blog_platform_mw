// Previous / Next plus page numbers. The parent owns the current page (it lives in the URL).
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="btn btn-outline btn-small" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      {pages.map((n) => (
        <button
          key={n}
          type="button"
          className={`btn btn-small ${n === page ? '' : 'btn-outline'}`}
          aria-current={n === page ? 'page' : undefined}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
      <button type="button" className="btn btn-outline btn-small" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </nav>
  );
}
