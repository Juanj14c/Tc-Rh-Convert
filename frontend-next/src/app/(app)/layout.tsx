"use client";

import { useState, type ReactNode } from "react";
import MainLayout from "@/components/layout/MainLayout";

interface UserProfile {
  name: string;
  email: string;
  image: string;
}

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [profile, setProfile] =
    useState<UserProfile>({
      name: "Juan Pérez",
      email: "juan@empresa.com",
      image: "",
    });

  const handleLogout = () => {
    window.location.href = "/login";
  };

  return (
    <MainLayout
      isAdmin={true}
      onLogout={handleLogout}
      profile={profile}
      searchTerm=""
      onSearchChange={() => {}}
    >
      {children}
    </MainLayout>
  );
}