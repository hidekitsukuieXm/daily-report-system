/**
 * テーブルコンポーネント
 */

import type { ReactNode } from 'react';

import './Table.css';

export type TableColumn<T> = {
  /** カラムキー */
  key: keyof T | string;
  /** ヘッダーラベル */
  header: string;
  /** 幅 */
  width?: string | number;
  /** 配置 */
  align?: 'left' | 'center' | 'right';
  /** ソート可能 */
  sortable?: boolean;
  /** レンダー関数 */
  render?: (value: unknown, row: T, index: number) => ReactNode;
};

export type SortDirection = 'asc' | 'desc';

export type SortState = {
  key: string;
  direction: SortDirection;
};

export type TableProps<T> = {
  /** データ配列 */
  data: T[];
  /** カラム定義 */
  columns: TableColumn<T>[];
  /** 行キー取得関数 */
  rowKey: keyof T | ((row: T, index: number) => string | number);
  /** ローディング状態 */
  loading?: boolean;
  /** データなし時のメッセージ */
  emptyMessage?: string;
  /** ソート状態 */
  sortState?: SortState;
  /** ソート変更ハンドラー */
  onSortChange?: (sort: SortState) => void;
  /** 行クリックハンドラー */
  onRowClick?: (row: T, index: number) => void;
  /** ストライプ表示 */
  striped?: boolean;
  /** ホバー効果 */
  hoverable?: boolean;
  /** ボーダー */
  bordered?: boolean;
  /** コンパクト表示 */
  compact?: boolean;
};

export function Table<T extends Record<string, unknown>>({
  data,
  columns,
  rowKey,
  loading = false,
  emptyMessage = 'データがありません',
  sortState,
  onSortChange,
  onRowClick,
  striped = false,
  hoverable = true,
  bordered = false,
  compact = false,
}: TableProps<T>) {
  const getRowKey = (row: T, index: number): string | number => {
    if (typeof rowKey === 'function') {
      return rowKey(row, index);
    }
    return row[rowKey] as string | number;
  };

  const getValue = (row: T, key: keyof T | string): unknown => {
    const keys = String(key).split('.');
    let value: unknown = row;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return value;
  };

  const handleSort = (columnKey: string) => {
    if (!onSortChange) return;

    const newDirection: SortDirection =
      sortState?.key === columnKey && sortState.direction === 'asc'
        ? 'desc'
        : 'asc';

    onSortChange({ key: columnKey, direction: newDirection });
  };

  const tableClasses = [
    'table',
    striped && 'table--striped',
    hoverable && 'table--hoverable',
    bordered && 'table--bordered',
    compact && 'table--compact',
  ]
    .filter(Boolean)
    .join(' ');

  const getAriaSortValue = (
    isSorted: boolean,
    direction?: SortDirection
  ): 'ascending' | 'descending' | undefined => {
    if (!isSorted) return undefined;
    return direction === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div className="table-wrapper">
      <table className={tableClasses} role="grid">
        <thead className="table-header">
          <tr>
            {columns.map((column) => {
              const isSortable = column.sortable && onSortChange;
              const isSorted = sortState?.key === column.key;

              return (
                <th
                  key={String(column.key)}
                  className={`table-header-cell table-header-cell--${column.align ?? 'left'}`}
                  style={{ width: column.width }}
                  scope="col"
                  aria-sort={getAriaSortValue(isSorted, sortState?.direction)}
                >
                  {isSortable ? (
                    <button
                      type="button"
                      className={`table-sort-button ${isSorted ? 'table-sort-button--active' : ''}`}
                      onClick={() => handleSort(String(column.key))}
                    >
                      <span>{column.header}</span>
                      <span className="table-sort-icon" aria-hidden="true">
                        {isSorted && sortState.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className="table-body">
          {loading && (
            <tr>
              <td colSpan={columns.length} className="table-loading-cell">
                <span className="table-loading">読み込み中...</span>
              </td>
            </tr>
          )}

          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="table-empty-cell">
                {emptyMessage}
              </td>
            </tr>
          )}

          {!loading &&
            data.map((row, rowIndex) => (
              <tr
                key={getRowKey(row, rowIndex)}
                className={`table-row ${onRowClick ? 'table-row--clickable' : ''}`}
                onClick={() => onRowClick?.(row, rowIndex)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRowClick?.(row, rowIndex);
                  }
                }}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'button' : undefined}
              >
                {columns.map((column) => {
                  const value = getValue(row, column.key);
                  const content = column.render
                    ? column.render(value, row, rowIndex)
                    : (value as ReactNode);

                  return (
                    <td
                      key={String(column.key)}
                      className={`table-cell table-cell--${column.align ?? 'left'}`}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
