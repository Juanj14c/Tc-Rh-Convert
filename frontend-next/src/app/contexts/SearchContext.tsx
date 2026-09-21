"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface SearchContextValue {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

const SearchContext =
  createContext<SearchContextValue | undefined>(
    undefined,
  );

interface SearchProviderProps {
  children: ReactNode;
}

export function SearchProvider({
  children,
}: SearchProviderProps) {
  const [searchTerm, setSearchTerm] =
    useState("");

  return (
    <SearchContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);

  if (!context) {
    throw new Error(
      "useSearch debe utilizarse dentro de SearchProvider.",
    );
  }

  return context;
}