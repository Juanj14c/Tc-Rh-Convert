"use client";

import { type ReactNode } from "react";

import MainLayout from "@/components/layout/MainLayout";
import { ProfileProvider } from "@/contexts/profileContext";
import { useProfile } from "@/hooks/useProfile";
import QuickTipNotifier from "@/components/quickTips/QuickTipNotifier";
import { SearchProvider } from "@/contexts/SearchContext";

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayoutContent({ children }: AppLayoutProps) {
  const { profile, isAdmin } = useProfile();

  const handleLogout = () => {
    window.location.href = "/login";
  };

  return (
    <MainLayout
      isAdmin={isAdmin}
      onLogout={handleLogout}
      profile={profile}
     
    >
      {children}
    </MainLayout>
  );
}

export default function AppLayout({
  children,
}: AppLayoutProps) {
  return (
    <ProfileProvider>
      <SearchProvider >
      <QuickTipNotifier />

      <AppLayoutContent>
        {children}
      </AppLayoutContent>
      </SearchProvider>
    </ProfileProvider>
  );
}