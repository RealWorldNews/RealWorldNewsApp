'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useScrollRestoration() {
  const pathname = usePathname();

  useEffect(() => {
    const storedPosition = sessionStorage.getItem(`scrollPosition-${pathname}`);
    if (storedPosition) {
      window.scrollTo(0, parseInt(storedPosition, 10));
    }

    const handleRouteChange = () => {
      sessionStorage.setItem(`scrollPosition-${pathname}`, window.scrollY.toString());
    };

    window.addEventListener('beforeunload', handleRouteChange);

    return () => {
      window.removeEventListener('beforeunload', handleRouteChange);
      sessionStorage.setItem(`scrollPosition-${pathname}`, window.scrollY.toString());
    };
  }, [pathname]);
}
