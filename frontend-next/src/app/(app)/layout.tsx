"use client";

import { type ReactNode } from "react";

import MainLayout from "@/components/layout/MainLayout";
import { ProfileProvider } from "@/contexts/profileContext";
import { useProfile } from "@/hooks/useProfile";
import QuickTipNotifier from "@/components/quickTips/QuickTipNotifier";
import { SearchProvider } from "@/contexts/SearchContext";
import { createClient } from "@/lib/supabase/client";

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayoutContent({
  children,
}: AppLayoutProps) {
  const { profile, isAdmin } =
    useProfile();

  const handleLogout = async () => {
    const supabase = createClient();

    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "Error cerrando sesión:",
        error,
      );

      return;
    }

    /*
     * Una vez cerrada la sesión en Supabase,
     * regresamos al Login.
     */
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
      <SearchProvider>
        <QuickTipNotifier />

        <AppLayoutContent>
          {children}
        </AppLayoutContent>
      </SearchProvider>
    </ProfileProvider>
  );
}