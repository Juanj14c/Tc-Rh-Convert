"use client";

import {
  createContext,
  useCallback,
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
  employeeType?:string;
}

interface ProfileContextValue {
  profile: UserProfile;
  isAdmin: boolean;
  isProfileLoading: boolean;
  setProfile: (profile: UserProfile) => void;
  refreshProfile: () => Promise<void>;
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
  employeeType: "",
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

  const refreshProfile = useCallback(async () => {
    const supabase = createClient();

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setProfile(emptyProfile);
        setIsAdmin(false);
        return;
      }

      const [
        {
          data: profileData,
          error: profileError,
        },
        {
          data: employeeData,
          error: employeeError,
        },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "name, email, role, country, area, campaign, avatar_url, created_at",
          )
          .eq("id", user.id)
          .single(),

        supabase
          .from("employees")
          .select("*")
          .eq("profile_id", user.id)
          .maybeSingle(),
      ]);

      if (employeeError) {
        console.error(
          "Error consultando el empleado:",
          {
            code: employeeError.code,
            message: employeeError.message,
          },
        );
      }

      const employee = employeeData as unknown as
      | Record <string, unknown>
      |null

      const getEmployeeText= (...keys: string[]):string =>{
        for (const key of keys){
          const value = employee?.[key];
          if (typeof value === "string" && value.trim()){
            return value.trim();
          }
          if (typeof value === "number"){
            return String(value);
          }
        }
        return "";
      };
      const employeeName = getEmployeeText("name");

      const employeeType= getEmployeeText(
        "employee_type",
      ).toLowerCase();

      const employeeCountry = getEmployeeText(

        "country_name",
              );

      const employeeArea =getEmployeeText("area");
      const employeeCampaign = getEmployeeText("campaign");

      const employeeEntryDate= getEmployeeText(
        "hire_date"
      )

      if (profileError || !profileData) {
        console.error(
          "Error cargando el perfil:",
          {
            code: profileError?.code,
            message: profileError?.message,
          },
        );

        setProfile({
          ...emptyProfile,
          name:
            employeeName ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email ||
            "",
          email: user.email || "",
          image:
            user.user_metadata?.avatar_url || "",
          employeeType,
          countryName: employeeCountry,
          area: employeeArea,
          campaign:
          employeeType === "planta"
          ?""
          : employeeCampaign,
          entryDate: employeeEntryDate
          ? employeeEntryDate.slice(0, 10)
          : "",
        });

        setIsAdmin(false);
        return;
      }

      /*
       * Prioridad del nombre:
       * 1. employees.name, cuando existe el vínculo.
       * 2. profiles.name.
       * 3. Metadatos del usuario.
       */
      const currentName =
       employeeName ||
       profileData.name ||
       user.user_metadata?.full_name ||
       user.user_metadata?.name ||
       user.email ||
       "";

       const entryDateValue =
      employeeEntryDate || profileData.created_at || "";

      let image = "";

      if (profileData.avatar_url) {
        const {
          data: signedData,
          error: signedUrlError,
        } = await supabase.storage
          .from("avatars")
          .createSignedUrl(
            profileData.avatar_url,
            60 * 60,
          );

        if (signedUrlError) {
          console.error(
            "Error obteniendo la foto de perfil:",
            signedUrlError,
          );
        } else {
          image = signedData?.signedUrl || "";
        }
      }

      setProfile({
        name: currentName,
        email:
          profileData.email ||
          user.email ||
          "",
        image,
        avatarPath:
          profileData.avatar_url || "",
        role: profileData.role || "",
        employeeType,
        countryName: employeeCountry,
        area: employeeArea,
        campaign:
          employeeType === "planta"
          ?""
          : employeeCampaign,
        entryDate: employeeEntryDate
         ? employeeEntryDate.slice(0,10)
        : (profileData.created_at || "").slice(0,10),
        });

      setIsAdmin(
        profileData.role === "admin",
      );
    } catch (error) {
      console.error(
        "Error inesperado cargando el perfil:",
        error,
      );
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

 useEffect(() => {
  const supabase = createClient();

  const initialLoadTimer = window.setTimeout(() => {
    void refreshProfile();
  }, 0);

  let authRefreshTimer: number | undefined;

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(() => {
    if (authRefreshTimer !== undefined) {
      window.clearTimeout(authRefreshTimer);
    }

    authRefreshTimer = window.setTimeout(() => {
      void refreshProfile();
    }, 0);
  });

  return () => {
    window.clearTimeout(initialLoadTimer);

    if (authRefreshTimer !== undefined) {
      window.clearTimeout(authRefreshTimer);
    }

    subscription.unsubscribe();
  };
}, [refreshProfile]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isAdmin,
        isProfileLoading,
        setProfile,
        refreshProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}