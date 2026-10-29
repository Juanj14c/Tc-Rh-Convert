import { NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SessionDb = Awaited<ReturnType<typeof createSessionClient>>;
type EmployeeOptionsRow = {
  country_name: string | null;
  area: string | null;
  campaign: string | null;
  employee_type: "planta" | "campana" | null;
  active: boolean;
};

type CampaignOption = { id: string; name: string; country: string };

function clean(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function uniqueSorted(values: string[]): string[] {
  const byKey = new Map<string, string>();
  for (const value of values) {
    const normalized = clean(value);
    if (normalized) {
      const key = normalized.toLocaleLowerCase("es");
      if (!byKey.has(key)) byKey.set(key, normalized);
    }
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b, "es"));
}

export async function GET() {
  const db: SessionDb = await createSessionClient();
  const { data: { user }, error: userError } = await db.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[api/mural/options] No se pudo verificar el perfil:", profileError.message);
    return NextResponse.json({ error: "No se pudo verificar tu perfil." }, { status: 500 });
  }
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Solo Talento & Cultura puede consultar las opciones de segmentación." }, { status: 403 });
  }

  const { data, error } = await db
    .from("employees")
    .select("country_name, area, campaign, employee_type, active")
    .eq("active", true);

  if (error) {
    console.error("[api/mural/options] Error consultando empleados:", error.message);
    return NextResponse.json({ error: "No se pudieron cargar las opciones desde Empleados." }, { status: 500 });
  }

  const rows = (data ?? []) as EmployeeOptionsRow[];
  const countries = uniqueSorted(rows.map((row) => row.country_name ?? ""));
  const areas = uniqueSorted(rows
    .filter((row) => row.employee_type !== "campana")
    .map((row) => row.area ?? ""));

  const campaignsByKey = new Map<string, CampaignOption>();
  for (const row of rows) {
    const name = clean(row.campaign);
    const country = clean(row.country_name);
    if (!name || !country) continue;
    const key = `${country.toLocaleLowerCase("es")}::${name.toLocaleLowerCase("es")}`;
    if (!campaignsByKey.has(key)) {
      campaignsByKey.set(key, { id: key, name, country });
    }
  }

  const campaigns = [...campaignsByKey.values()].sort((a, b) =>
    a.country.localeCompare(b.country, "es") || a.name.localeCompare(b.name, "es"),
  );

  return NextResponse.json(
    { countries, areas, campaigns },
    { headers: { "Cache-Control": "no-store" } },
  );
}
