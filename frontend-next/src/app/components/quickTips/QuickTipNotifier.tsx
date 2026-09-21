"use client";

import { useEffect } from "react";
import { sileo } from "sileo";

import { initialQuickTips } from "@/data/quickTips";

import type { QuickTip } from "@/types/quickTips";

import { useProfile } from "@/hooks/useProfile";

const STORAGE_KEY =
  "tc-rh-quick-tips";

const SHOWN_KEY =
  "tc-rh-quick-tips-shown";

interface ShownTipsData {
  date: string;
  ids: number[];
}

function getTips(): QuickTip[] {
  try {
    const stored =
      window.localStorage.getItem(
        STORAGE_KEY,
      );

    if (!stored) {
      return initialQuickTips;
    }

    return JSON.parse(
      stored,
    ) as QuickTip[];
  } catch {
    return initialQuickTips;
  }
}

function getShownData(): ShownTipsData {
  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  try {
    const stored =
      window.localStorage.getItem(
        SHOWN_KEY,
      );

    if (!stored) {
      return {
        date: today,
        ids: [],
      };
    }

    const parsed =
      JSON.parse(
        stored,
      ) as ShownTipsData;

    if (
      parsed.date !== today ||
      !Array.isArray(parsed.ids)
    ) {
      return {
        date: today,
        ids: [],
      };
    }

    return parsed;
  } catch {
    return {
      date: today,
      ids: [],
    };
  }
}

function saveShownData(
  data: ShownTipsData,
) {
  window.localStorage.setItem(
    SHOWN_KEY,
    JSON.stringify(data),
  );
}

function tipMatchesUser(
  tip: QuickTip,
  area?: string,
  campaign?: string,
) {
  if (tip.audienceType === "all") {
    return true;
  }

  if (tip.audienceType === "area") {
    return (
      tip.audienceValue
        ?.trim()
        .toLowerCase() ===
      area
        ?.trim()
        .toLowerCase()
    );
  }

  if (
    tip.audienceType ===
    "campaign"
  ) {
    return (
      tip.audienceValue
        ?.trim()
        .toLowerCase() ===
      campaign
        ?.trim()
        .toLowerCase()
    );
  }

  return false;
}

export default function QuickTipNotifier() {
  const { profile } =
    useProfile();

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        const tips = getTips().filter(
          (tip) => tip.active,
        );

        if (tips.length === 0) {
          return;
        }

        const shownData =
          getShownData();

        const shownIds =
          shownData.ids;

        const availableTips =
          tips.filter(
            (tip) =>
              !shownIds.includes(
                tip.id,
              ) &&
              tipMatchesUser(
                tip,
                profile.area,
                profile.campaign,
              ),
          );

        const tip =
          availableTips[0];

        if (!tip) {
          return;
        }

        sileo.info({
          title: `💡 ${tip.title}`,
          description:
            tip.message,
          duration: 6000,
          position: "top-center",
        });

        saveShownData({
          date: shownData.date,
          ids: [
            ...shownIds,
            tip.id,
          ],
        });
      }, 1200);

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [
    profile.area,
    profile.campaign,
  ]);

  return null;
}