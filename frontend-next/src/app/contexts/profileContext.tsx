"use client";

import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { createClient } from "@/lib/supabase/client";

export interface UserProfile {
  name: string;
  email: string;
  image: string;

  avatarPath?: string;
  role?: string;

  countryName?: string;
  area?: string;
  campaign?: string;
  entryDate?: string;
}

interface ProfileContextValue {
  profile: UserProfile;
  isAdmin: boolean;
  isProfileLoading: boolean;
  setProfile: (profile: UserProfile) => void;
}

export const ProfileContext =
  createContext<ProfileContextValue | undefined>(
    undefined,
  );

interface ProfileProviderProps {
  children: ReactNode;
}

const emptyProfile: UserProfile = {
  name: "",
  email: "",
  image: "",
  avatarPath: "",
  role: "",
  countryName: "",
  area: "",
  campaign: "",
  entryDate: "",
};

export function ProfileProvider({
  children,
}: ProfileProviderProps) {
  const [profile, setProfile] =
    useState<UserProfile>(emptyProfile);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [isProfileLoading, setIsProfileLoading] =
    useState(true);

  useEffect(() => {
    const supabase = createClient();

    const loadProfile = async () => {
      setIsProfileLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setProfile(emptyProfile);
        setIsAdmin(false);
        setIsProfileLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "name, email, role, country, area, campaign, avatar_url, created_at",
        )
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(
          "Error cargando el perfil:",
          {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          },
        );

        setProfile({
          name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email ||
            "",
          email: user.email || "",
          image:
            user.user_metadata?.avatar_url ||
            "",
          role: "",
        });

        setIsAdmin(false);
        setIsProfileLoading(false);
        return;
      }

      let image = "";

      if (data.avatar_url) {
        const {
          data: signedData,
          error: signedUrlError,
        } = await supabase.storage
          .from("avatars")
          .createSignedUrl(
            data.avatar_url,
            60 * 60,
          );

        if (signedUrlError) {
          console.error(
            "Error obteniendo la foto de perfil:",
            signedUrlError,
          );
        } else {
          image =
            signedData?.signedUrl ?? "";
        }
      }

      setProfile({
        name: data.name || "",
        email:
          data.email ||
          user.email ||
          "",
        image,
        avatarPath:
          data.avatar_url || "",
        role:
          data.role || "",
        countryName:
          data.country || "",
        area:
          data.area || "",
        campaign:
          data.campaign || "",
        entryDate:
          data.created_at || "",
      });

      setIsAdmin(
        data.role === "admin",
      );

      setIsProfileLoading(false);
    };

    void loadProfile();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(() => {
        void loadProfile();
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isAdmin,
        isProfileLoading,
        setProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}