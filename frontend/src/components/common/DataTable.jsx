import { FiEdit2, FiTrash2 } from 'react-icons/fi';

function SkeletonRows({ cols, showActions }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-slate-100">
          {cols.map((c) => (
            <td key={c.key} className="px-4 py-3">
              <div className="h-4 rounded bg-slate-200" />
            </td>
          ))}
          {showActions ? (
            <td className="px-4 py-3">
              <div className="h-8 w-16 rounded bg-slate-200" />
            </td>
          ) : null}
        </tr>
      ))}
    </>
  );
}

export default function DataTable({
  columns,
  data = [],
  onEdit,
  onDelete,
  onRowClick,
  loading = false,
  emptyMessage = 'No records found.',
  emptyState,
}) {
  const showActions = Boolean(onEdit || onDelete);
  const colCount = columns.length + (showActions ? 1 : 0);
  const rowClickable = typeof onRowClick === 'function';

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-800">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-blue-50/80">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`whitespace-nowrap px-4 py-3 font-semibold text-indigo-950 ${col.headerClassName ?? ''}`}
                >
                  {col.label}
                </th>
              ))}
              {showActions ? (
                <th scope="col" className="px-4 py-3 text-right font-semibold text-indigo-950">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <SkeletonRows cols={columns} showActions={showActions} />
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  {emptyState ?? emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row.id ?? rowIndex}
                  className={`group transition odd:bg-slate-50/50 hover:bg-indigo-50/40 ${rowClickable ? 'cursor-pointer' : ''}`}
                  onClick={rowClickable ? () => onRowClick(row) : undefined}
                  tabIndex={rowClickable ? 0 : undefined}
                  onKeyDown={
                    rowClickable
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 align-middle ${col.nowrap === false ? '' : 'whitespace-nowrap'} ${col.cellClassName ?? ''}`}
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {showActions ? (
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                        {onEdit ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(row);
                            }}
                            className="rounded-lg p-2 text-indigo-600 transition hover:bg-indigo-100"
                            aria-label="Edit row"
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </button>
                        ) : null}
                        {onDelete ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(row);
                            }}
                            className="rounded-lg p-2 text-red-600 transition hover:bg-red-100"
                            aria-label="Delete row"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
