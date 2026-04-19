// Create a new file PaginationWrapper.tsx (or .jsx)
// Add 'use client' directive at the top of this file
'use client';

import { useRouter } from 'next/navigation';
import Pagination from './pagination'; // Import the Pagination component

interface PaginationWrapperProps {
  currentPage: number;
  totalPages: number;
}

export default function PaginationWrapper({ currentPage, totalPages }: PaginationWrapperProps) {
  const router = useRouter();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      customClass="pagination-wrapper-default"
    />
  );
}
