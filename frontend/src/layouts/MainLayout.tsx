import { useState } from "react";
import type { ReactNode } from "react";
import Header from "../components/layout/Header";
import MobileMenu from "../components/layout/MobileMenu";
import Sidebar from "../components/layout/Sidebar";

type AppPage = "mural" | "chat" | "settings";

interface UserProfile {
  name: string;
  email: string;
  image: string;
}

interface MainLayoutProps {
  children: ReactNode;
  isAdmin?: boolean;
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
  profile: UserProfile;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

function MainLayout({
  children,
  isAdmin = false,
  activePage,
  onNavigate,
  onLogout,
  profile,
  searchTerm,
  onSearchChange,
}: MainLayoutProps) {
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  
    const handleToggleMobileMenu = () => {
    setIsMobileMenuOpen((current) => !current);
  };

  const handleMobileNavigate = (page: AppPage) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };
  

  return (
    <div className="app-layout">
      <Sidebar
        isAdmin={isAdmin}
        activePage={activePage}
        onNavigate={onNavigate}
      />

      <MobileMenu
        isOpen={isMobileMenuOpen}
        isAdmin={isAdmin}
        activePage={activePage}
        onNavigate={handleMobileNavigate}
        onToggle={handleToggleMobileMenu}
      />

      <div className="app-main">
        <Header
          onLogout={onLogout}
          onSettings={() => onNavigate("settings")}
          profile={profile}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          showSearch={activePage !== "chat"}
        />

        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;