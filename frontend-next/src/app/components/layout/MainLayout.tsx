"use client";

import {
  useState,
  type ReactNode,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import Header from "@/components/layout/Header";
import MobileMenu from "@/components/layout/MobileMenu";
import Sidebar from "@/components/layout/Sidebar";

import { useSearch } from "@/contexts/SearchContext";
import { useProfile } from "@/hooks/useProfile";

interface UserProfile {
  name: string;
  email: string;
  image: string;
  role?: string;
}

interface MainLayoutProps {
  children: ReactNode;
  isAdmin?: boolean;
  onLogout: () => void | Promise<void>;
  profile: UserProfile;
}

export default function MainLayout({
  children,
  isAdmin = false,
  onLogout,
  profile,
}: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    isProfileLoading,
  } = useProfile();

  const {
    searchTerm,
    setSearchTerm,
  } = useSearch();

  const [
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  ] = useState(false);

  /*
   * La búsqueda del Header solo aparece
   * en Mural.
   */
  const showSearch =
    pathname === "/mural";

  const handleToggleMobileMenu =
    () => {
      setIsMobileMenuOpen(
        (current) => !current,
      );
    };

  return (
    <div className="app-layout">
      <Sidebar isAdmin={isAdmin} />

      <MobileMenu
        isOpen={isMobileMenuOpen}
        isAdmin={isAdmin}
        onToggle={
          handleToggleMobileMenu
        }
      />

      <div className="app-main">
        <Header
          onLogout={onLogout}
          onSettings={() => {
            router.push("/settings");
          }}
          profile={profile}
          isProfileLoading={
            isProfileLoading
          }
          searchTerm={searchTerm}
          onSearchChange={
            setSearchTerm
          }
          showSearch={showSearch}
        />

        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}