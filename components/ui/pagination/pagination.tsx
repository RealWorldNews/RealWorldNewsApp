'use client'
import styles from './pagination.module.css';
import ChevronRightIcon from '../icons/chevron-right';
import ChevronLeftIcon from '../icons/chevron-left';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const getDisplayedPageNumbers = () => {
    const totalPageNumbersToShow = 6;
    const halfRange = Math.floor(totalPageNumbersToShow / 2);
    let start = Math.max(currentPage - halfRange, 1);
    let end = Math.min(start + totalPageNumbersToShow - 1, totalPages);

    if (end - start + 1 < totalPageNumbersToShow) {
      start = Math.max(end - totalPageNumbersToShow + 1, 1);
    }

    const pageNumbers = [];
    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  const pageNumbers = getDisplayedPageNumbers();

  return (
    <div className={styles.paginationWrapper}>
      <div className={styles.pagination}>
        {currentPage > 1 && (
          <button onClick={() => onPageChange(currentPage - 1)} className={styles.button}>
            <ChevronLeftIcon />
          </button>
        )}
        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`${styles.pageNumber} ${number === currentPage ? styles.active : ''}`}
          >
            {number}
          </button>
        ))}
        {currentPage < totalPages && (
          <button onClick={() => onPageChange(currentPage + 1)} className={styles.button}>
            <ChevronRightIcon />
          </button>
        )}
      </div>
    </div>
  );
}

export default Pagination;
