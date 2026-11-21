function TablePagination({
  label = 'Páginas de resultados',
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
}) {
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);
  const range = from === to ? `${from}` : `${from}–${to}`;
  const summary =
    totalItems <= 1
      ? `${totalItems} ${totalItems === 1 ? 'registro' : 'registros'}`
      : `${range} de ${totalItems} registros`;

  return (
    <div className="p-4 bg-med-primary-50/50 border-t border-med-border flex items-center justify-between gap-2 text-xs text-med-text-sub">
      <span aria-live="polite">{summary}</span>
      <nav aria-label={label} className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-2.5 py-1 border border-med-border rounded bg-white text-med-text-sub hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-2.5 py-1 border border-med-border rounded bg-white text-med-text-sub hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Siguiente
        </button>
      </nav>
    </div>
  );
}

export default TablePagination;
