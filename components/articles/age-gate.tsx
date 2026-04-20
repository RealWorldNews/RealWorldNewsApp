"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import classes from "./age-gate.module.css";

const STORAGE_KEY = "rwn:age-gate:18plus";

interface AgeGateProps {
  sourceLabel: string;
  children: React.ReactNode;
}

export default function AgeGate({ sourceLabel, children }: AgeGateProps) {
  const [confirmed, setConfirmed] = useState<boolean | null>(null);

  useEffect(() => {
    setConfirmed(window.localStorage.getItem(STORAGE_KEY) === "yes");
  }, []);

  const confirm = () => {
    window.localStorage.setItem(STORAGE_KEY, "yes");
    setConfirmed(true);
  };

  if (confirmed === null) return null;
  if (confirmed) return <>{children}</>;

  return (
    <div className={classes.wrap}>
      <h1 className={classes.title}>Sensitive content</h1>
      <p className={classes.lead}>
        This article is from <strong>{sourceLabel}</strong>, an independent publication covering
        organized crime in Mexico and beyond. Posts may contain graphic descriptions of violence,
        injury, or death.
      </p>
      <p className={classes.confirm}>You must be <strong>18 or older</strong> to continue.</p>
      <div className={classes.actions}>
        <button type="button" onClick={confirm} className={classes.primary}>
          I&apos;m 18+ — Continue
        </button>
        <Link href="/" className={classes.secondary}>
          Go back
        </Link>
      </div>
    </div>
  );
}
