
"use client";

import { useEffect } from "react";
import { sileo } from "sileo";

import type { QuickTip } from "@/types/quickTips";
import { useProfile } from "@/hooks/useProfile";

const SHOWN_KEY = "tc-rh-quick-tips-shown";

interface ShownTipsData {
  date: string;
  ids: number[];
}

interface TipsResponse {
  tips?: QuickTip[];
  error?: string;
}

function normalizeMatch(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es");
}

/*
 * La API es la fuente de verdad.
 * No usamos consejos de ejemplo ni listas de localStorage.
 */
async function getTips(): Promise<QuickTip[]> {
  const response = await fetch("/api/quick-tips", {
    method: "GET",
    cache: "no-store",
  });

  const result =
    (await response.json().catch(() => null)) as
      | TipsResponse
      | null;

  if (!response.ok) {
    throw new Error(
      result?.error || "No se pudieron cargar los consejos.",
    );
  }

  return Array.isArray(result?.tips)
    ? result.tips
    : [];
}

/*
 * Se utiliza para el administrador, cuya API devuelve
 * todos los consejos para gestionarlos.
 *
 * Para los empleados, la propia API ya filtra la audiencia
 * permitida según su asignación laboral.
 */
function tipMatchesUser(
  tip: QuickTip,
  country?: string | null,
  area?: string | null,
  campaign?: string | null,
): boolean {
  if (tip.audienceType === "all") {
    return true;
  }

  // Un consejo segmentado sin país no tiene
  // una audiencia válida en el nuevo modelo.
  if (
    !tip.audienceCountry ||
    normalizeMatch(tip.audienceCountry) !==
      normalizeMatch(country)
  ) {
    return false;
  }

  if (tip.audienceType === "area") {
    return (
      normalizeMatch(tip.audienceValue) ===
      normalizeMatch(area)
    );
  }

  if (tip.audienceType === "campaign") {
    return (
      normalizeMatch(tip.audienceValue) ===
      normalizeMatch(campaign)
    );
  }

  return false;
}

function getShownData(): ShownTipsData {
  const today = new Date().toISOString().slice(0, 10);

  try {
    const stored = window.localStorage.getItem(SHOWN_KEY);

    if (!stored) {
      return { date: today, ids: [] };
    }

    const parsed = JSON.parse(stored) as ShownTipsData;

    if (
      parsed.date !== today ||
      !Array.isArray(parsed.ids)
    ) {
      return { date: today, ids: [] };
    }

    return {
      date: today,
      ids: parsed.ids.filter(
        (id): id is number => Number.isSafeInteger(id),
      ),
    };
  } catch {
    return { date: today, ids: [] };
  }
}

function saveShownData(data: ShownTipsData): void {
  try {
    window.localStorage.setItem(
      SHOWN_KEY,
      JSON.stringify(data),
    );
  } catch (error) {
    console.error(
      "[Consejos] No se pudo guardar el estado de notificaciones:",
      error,
    );
  }
}

export default function QuickTipNotifier() {
  const { profile, isAdmin } = useProfile();

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const tips = await getTips();

          if (cancelled) {
            return;
          }

          const activeTips = tips.filter(
            (tip) => tip.active,
          );

          /*
           * Para administradores, la API devuelve todos
           * los consejos. Filtramos por su audiencia antes
           * de mostrar una notificación.
           *
           * Para empleados, la API ya realiza ese filtro
           * en el servidor.
           */
          const availableForUser = isAdmin
            ? activeTips.filter((tip) =>
                tipMatchesUser(
                  tip,
                  profile.countryName,
                  profile.area,
                  profile.campaign,
                ),
              )
            : activeTips;

          if (availableForUser.length === 0) {
            return;
          }

          const shownData = getShownData();
          const shownIds = shownData.ids;

          const nextTip = availableForUser.find(
            (tip) => !shownIds.includes(tip.id),
          );

          if (!nextTip || cancelled) {
            return;
          }

          sileo.info({
            title: `💡 ${nextTip.title}`,
            description: nextTip.message,
            duration: 6000,
            position: "top-center",
          });

          saveShownData({
            date: shownData.date,
            ids: [...shownIds, nextTip.id],
          });
        } catch (error) {
          if (!cancelled) {
            console.error(
              "[Consejos] No se pudieron cargar las notificaciones:",
              error,
            );
          }
        }
      })();
    }, 1200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    isAdmin,
    profile.countryName,
    profile.area,
    profile.campaign,
  ]);

  return null;
}
