'use client';

import { useScrollRestoration } from '../hooks/useScrollRestoration';

export default function ScrollRestorationWrapper({ children }: { children: React.ReactNode }) {
  useScrollRestoration();

  return <>{children}</>;
}
