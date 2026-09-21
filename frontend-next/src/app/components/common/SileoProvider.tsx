"use client";

import type { ReactNode } from "react";
import { Toaster } from "sileo";

interface SileoProviderProps {
  children: ReactNode;
}

export default function SileoProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Toaster
        position="top-center"
        offset={72}
      />
      {children}
    </>
  );
}