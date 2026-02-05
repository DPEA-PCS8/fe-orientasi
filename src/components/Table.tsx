import React from 'react';
import './Table.css';

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  sortKey?: string; // If different from accessor
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  errorMessage?: string | null;
  onSort?: (key: string) => void;
}

function Table<T>({ 
  columns, 
  data, 
  isLoading = false, 
  emptyMessage = 'No data available', 
  errorMessage = null,
  onSort 
}: TableProps<T>) {
  
  if (isLoading) {
    return (
      <div className="table-container">
        <div className="loading-state">Loading data...</div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="table-container">
        <div className="error-state">{errorMessage}</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th 
                key={index} 
                onClick={() => col.sortable && onSort && col.sortKey ? onSort(col.sortKey) : col.sortable && onSort && col.accessor ? onSort(col.accessor as string) : undefined}
                className={col.sortable ? 'sortable' : ''}
                style={{ width: col.width }}
              >
                {col.header} {col.sortable ? '↕' : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col, colIndex) => (
                <td key={colIndex}>
                  {col.render 
                    ? col.render(item, rowIndex) 
                    : col.accessor 
                      ? (item[col.accessor] as React.ReactNode) 
                      : null
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
