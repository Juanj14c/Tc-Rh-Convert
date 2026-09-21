"use client";

import {
  createContext,
  useState,
  type ReactNode,
} from "react";

export interface UserProfile {
  name: string;
  email: string;
  image: string;

  countryName?: string;
  area?: string;
  campaign?: string;
  entryDate?: string;
}

interface ProfileContextValue {
  profile: UserProfile;
  isAdmin: boolean;
  setProfile: (
    profile: UserProfile,
  ) => void;
}

export const ProfileContext =
  createContext<
    ProfileContextValue | undefined
  >(undefined);

interface ProfileProviderProps {
  children: ReactNode;
}

export function ProfileProvider({
  children,
}: ProfileProviderProps) {
  const [profile, setProfile] =
    useState<UserProfile>({
      name: "Juan Pérez",
      email: "juan@empresa.com",
      image: "",
      countryName: "Colombia",
      area: "Comercial",
      campaign: "WOM",
      entryDate: "",
    });

  // TEMPORAL:
  // posteriormente vendrá de Supabase/Auth.
  const isAdmin = true;

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isAdmin,
        setProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}