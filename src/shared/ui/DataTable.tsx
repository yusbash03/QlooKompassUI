import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export interface Column<Row> {
  key: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  className?: string;
}

interface DataTableProps<Row> {
  caption: string;
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  /** Visually hide the caption (it stays available to screen readers). */
  hideCaption?: boolean;
}

/** Simple semantic table with the report styling (component sheet §10). */
export function DataTable<Row>({ caption, columns, rows, rowKey, hideCaption = true }: DataTableProps<Row>) {
  return (
    <div className="overflow-x-auto rounded-(--radius-card) border border-border bg-surface">
      <table className="w-full border-collapse text-left text-[13px]">
        <caption className={cn('px-4 py-2 text-left text-sm font-semibold', hideCaption && 'sr-only')}>
          {caption}
        </caption>
        <thead className="bg-surface-muted text-xs font-semibold text-ink-muted">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={cn('px-4 py-2.5 font-semibold', column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-t border-hairline">
              {columns.map((column) => (
                <td key={column.key} className={cn('px-4 py-2.5 align-middle', column.className)}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
