"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import classes from './search-bar.module.css'

interface SearchBarProps {
    initialQuery: string;
  }

export default function SearchBar({ initialQuery }: SearchBarProps) {
  const [search, setSearch] = useState(initialQuery || "");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setSearch(initialQuery);
  }, [initialQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <input
      type="text"
      value={search}
      onChange={handleSearch}
      placeholder="Search ..."
      className={classes.searchBar}
      
    />
  );
}
