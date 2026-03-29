import type { ReactNode } from "react";

type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
};

type TableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  emptyState: ReactNode;
};

export function Table<T>({ columns, rows, emptyState }: TableProps<T>) {
  if (!rows.length) {
    return <div className="rounded-[1.5rem] border border-dashed border-[var(--color-border)] px-5 py-8 text-sm text-[var(--color-text-muted)]">{emptyState}</div>;
  }

  return (
    <div className="overflow-x-auto scrollbar-thin rounded-[1.5rem] border border-[var(--color-border)] bg-white/70">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-[var(--color-border)] bg-white/75 text-[var(--color-text-muted)]">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`px-5 py-4 font-semibold ${column.className ?? ""}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-[var(--color-border)]/70 last:border-b-0 hover:bg-[var(--color-primary-soft)]/40">
              {columns.map((column) => (
                <td key={column.key} className={`px-5 py-4 align-top text-[var(--color-text)] ${column.className ?? ""}`}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}