"use client";

import { useState, type ReactNode } from "react";

import Header from "@/components/layout/Header";
import MobileMenu from "@/components/layout/MobileMenu";
import Sidebar from "@/components/layout/Sidebar";

interface UserProfile {
  name: string;
  email: string;
  image: string;
}

interface MainLayoutProps {
  children: ReactNode;
  isAdmin?: boolean;
  onLogout: () => void;
  profile: UserProfile;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

export default function MainLayout({
  children,
  isAdmin = false,
  onLogout,
  profile,
  searchTerm = "",
  onSearchChange,
}: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  const handleToggleMobileMenu = () => {
    setIsMobileMenuOpen((current) => !current);
  };

  return (
    <div className="app-layout">
      <Sidebar isAdmin={isAdmin} />

      <MobileMenu
        isOpen={isMobileMenuOpen}
        isAdmin={isAdmin}
        onToggle={handleToggleMobileMenu}
      />

      <div className="app-main">
        <Header
          onLogout={onLogout}
          onSettings={() => {
            window.location.href = "/settings";
          }}
          profile={profile}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          showSearch={true}
        />

        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}