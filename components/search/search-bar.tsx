"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import classes from "./search-bar.module.css";

interface SearchBarProps {
  initialQuery: string;
}

export default function SearchBar({ initialQuery }: SearchBarProps) {
  const [search, setSearch] = useState(initialQuery || "");
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearch(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      if (value.trim()) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      const qs = params.toString();
      router.push(qs ? `/?${qs}` : "/");
    }, 250);
  };

  return (
    <input
      type="text"
      value={search}
      onChange={handleSearch}
      placeholder="search ..."
      className={classes.searchBar}
    />
  );
}
