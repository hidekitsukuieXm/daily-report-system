/**
 * ページネーションコンポーネント
 */

import { useMemo, useCallback } from 'react';

import './Pagination.css';

export type PaginationProps = {
  /** 現在のページ（1から始まる） */
  currentPage: number;
  /** 総ページ数 */
  totalPages: number;
  /** ページ変更ハンドラー */
  onPageChange: (page: number) => void;
  /** 表示するページ番号の数 */
  siblingCount?: number;
  /** 最初と最後のページを常に表示 */
  showBoundaryPages?: boolean;
  /** 前へ/次へボタンのテキスト */
  previousLabel?: string;
  nextLabel?: string;
  /** 総件数表示 */
  totalCount?: number;
  /** 1ページあたりの件数 */
  pageSize?: number;
  /** 無効状態 */
  disabled?: boolean;
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showBoundaryPages = true,
  previousLabel = '前へ',
  nextLabel = '次へ',
  totalCount,
  pageSize,
  disabled = false,
}: PaginationProps) {
  const handlePrevious = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange]);

  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];

    const leftSibling = Math.max(currentPage - siblingCount, 1);
    const rightSibling = Math.min(currentPage + siblingCount, totalPages);

    const showLeftEllipsis = showBoundaryPages && leftSibling > 2;
    const showRightEllipsis = showBoundaryPages && rightSibling < totalPages - 1;

    if (showBoundaryPages && leftSibling > 1) {
      pages.push(1);
    }

    if (showLeftEllipsis) {
      pages.push('ellipsis');
    }

    for (let i = leftSibling; i <= rightSibling; i++) {
      if (!showBoundaryPages || i !== 1) {
        pages.push(i);
      }
    }

    if (showRightEllipsis) {
      pages.push('ellipsis');
    }

    if (showBoundaryPages && rightSibling < totalPages) {
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages, siblingCount, showBoundaryPages]);

  if (totalPages <= 1) {
    return null;
  }

  const startItem = totalCount && pageSize ? (currentPage - 1) * pageSize + 1 : null;
  const endItem =
    totalCount && pageSize ? Math.min(currentPage * pageSize, totalCount) : null;

  return (
    <nav
      className="pagination"
      role="navigation"
      aria-label="ページネーション"
    >
      {totalCount !== undefined && startItem && endItem && (
        <p className="pagination-info">
          {totalCount}件中 {startItem}〜{endItem}件を表示
        </p>
      )}

      <ul className="pagination-list">
        <li className="pagination-item">
          <button
            type="button"
            className="pagination-button pagination-button--prev"
            onClick={handlePrevious}
            disabled={disabled || currentPage === 1}
            aria-label="前のページへ"
          >
            {previousLabel}
          </button>
        </li>

        {pageNumbers.map((page, index) =>
          page === 'ellipsis' ? (
            <li
              key={`ellipsis-${index}`}
              className="pagination-item pagination-ellipsis"
              aria-hidden="true"
            >
              ...
            </li>
          ) : (
            <li key={page} className="pagination-item">
              <button
                type="button"
                className={`pagination-button pagination-button--page ${currentPage === page ? 'pagination-button--active' : ''}`}
                onClick={() => onPageChange(page)}
                disabled={disabled}
                aria-label={`${page}ページへ`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            </li>
          )
        )}

        <li className="pagination-item">
          <button
            type="button"
            className="pagination-button pagination-button--next"
            onClick={handleNext}
            disabled={disabled || currentPage === totalPages}
            aria-label="次のページへ"
          >
            {nextLabel}
          </button>
        </li>
      </ul>
    </nav>
  );
}
