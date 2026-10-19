import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  skeletonRows?: number;
}

export default function DataTable<T>({
  columns, data, keyExtractor, isLoading, skeletonRows = 5,
}: DataTableProps<T>) {
  return (
    <div className="bg-blue-900/10 backdrop-blur border border-gray-800 p-5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-blue-800/20 border-b border-gray-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading
              ? [...Array(skeletonRows)].map((_, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3.5">
                        <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              : data.map((item) => (
                  <tr
                    key={keyExtractor(item)}
                    className="hover:bg-gray-800/40 transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-3.5 text-gray-300 ${col.className ?? ''}`}>
                        {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as ReactNode}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
