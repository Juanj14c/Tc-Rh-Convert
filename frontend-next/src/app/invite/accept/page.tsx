"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import InviteWelcomeAnimation from "@/components/invite-welcome/InviteWelcomeAnimation";

export default function InviteAcceptPage() {
  const router = useRouter();

  const [name, setName] = useState("Bienvenido");
  const [ready, setReady] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadInvite() {
      const supabase = createClient();

      const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, ""),
      );

      const tokenHash = hashParams.get("token_hash");
      const type = hashParams.get("type");

      if (!tokenHash || type !== "invite") {
        router.replace("/login?error=invalid-invite");
        return;
      }

      window.history.replaceState(
        {},
        document.title,
        `${window.location.pathname}${window.location.search}`,
      );

      const { error: verifyError } =
        await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "invite",
        });

      if (cancelled) return;

      if (verifyError) {
        router.replace("/login?error=invite-expired");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      const profileName =
        profile?.name?.trim() ||
        user.user_metadata?.name?.trim() ||
        user.user_metadata?.full_name?.trim() ||
        user.user_metadata?.display_name?.trim() ||
        user.email?.split("@")[0] ||
        "";

      setName(profileName ? `Bienvenido ${profileName}` : "Bienvenido");
      setReady(true);
    }

    loadInvite();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!ready) return;

    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 4200);

    const redirectTimer = setTimeout(() => {
      router.replace("/mural");
    }, 5100);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(redirectTimer);
    };
  }, [ready, router]);

  if (!ready) {
    return null;
  }

  return (
    <main
      className={`invite-welcome-transition ${
        fading ? "invite-welcome-transition--fade" : ""
      }`}
    >
      <InviteWelcomeAnimation name={name} />

      <style jsx>{`
        .invite-welcome-transition {
          min-height: 100vh;
          opacity: 1;
          transition: opacity 900ms ease-in-out;
        }

        .invite-welcome-transition--fade {
          opacity: 0;
        }
      `}</style>
    </main>
  );
}
