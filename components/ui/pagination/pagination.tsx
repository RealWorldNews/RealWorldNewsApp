'use client';

import styles from './pagination.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  customClass?: string;
}

function pageList(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('ellipsis');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

function Pagination({ currentPage, totalPages, onPageChange, customClass }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = pageList(currentPage, totalPages);

  return (
    <div className={`${styles.paginationWrapper} ${customClass ? customClass : ''}`}>
      <nav className={styles.pagination} aria-label="Pagination">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          className={styles.button}
          aria-label="Previous page"
          aria-disabled={currentPage === 1}
          disabled={currentPage === 1}
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e${i}`} className={styles.ellipsis} aria-hidden>
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`${styles.pageNumber} ${p === currentPage ? styles.active : ''}`}
              aria-current={p === currentPage ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          className={styles.button}
          aria-label="Next page"
          aria-disabled={currentPage === totalPages}
          disabled={currentPage === totalPages}
        >
          ›
        </button>
      </nav>
    </div>
  );
}

export default Pagination;
