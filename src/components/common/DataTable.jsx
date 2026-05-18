import React from 'react';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const DataTable = ({ columns, rows, actions, loading = false }) => {
  return (
    <div className="w-full">
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {columns?.map((column) => (
                  <th key={column.key} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                    {column.label}
                  </th>
                ))}
                {actions && <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">ACTIONS</th>}
              </tr>
            </thead>
            <tbody>
              {rows?.map((row, index) => (
                <tr key={row.id || index} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  {columns?.map((column) => (
                    <td key={column.key} className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="p-4 align-middle text-right">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataTable;

