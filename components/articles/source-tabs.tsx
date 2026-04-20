"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import classes from "./source-tabs.module.css";

type Option = { value: string; label: string; count: number };

interface SourceTabsProps {
  options: Option[];
  active: string;
  totalCount: number;
}

export default function SourceTabs({ options, active, totalCount }: SourceTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const el = row.querySelector<HTMLButtonElement>('[aria-selected="true"]');
    if (el) {
      el.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }
  }, [active]);

  const setSource = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("page");
    if (value) next.set("source", value);
    else next.delete("source");
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `/?${qs}` : "/", { scroll: false });
    });
  };

  return (
    <div className={classes.rail}>
      <div
        ref={rowRef}
        className={classes.row}
        role="tablist"
        aria-label="Filter by source"
      >
        <button
          type="button"
          role="tab"
          aria-selected={active === ""}
          className={active === "" ? classes.pillActive : classes.pill}
          onClick={() => setSource("")}
        >
          All <span className={classes.count}>{totalCount}</span>
        </button>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active === opt.value}
            className={active === opt.value ? classes.pillActive : classes.pill}
            onClick={() => setSource(opt.value)}
          >
            {opt.label} <span className={classes.count}>{opt.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
