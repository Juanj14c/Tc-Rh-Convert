import { NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase/server";

type AudienceType = "all" | "area" | "campaign";

type QuickTipRow = {
  id: number;
  title: string;
  message: string;
  audience_type: AudienceType;
  audience_value: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type QuickTipData = {
  title: string;
  message: string;
  audience_type: AudienceType;
  audience_value: string;
  active: boolean;
};

type SessionSupabaseClient =
  Awaited<ReturnType<typeof createSessionClient>>;

type ProfileInfo = {
  role: string | null;
  area: string | null;
  campaign: string | null;
};

function toQuickTip(row: QuickTipRow) {
  return {
    id: Number(row.id),
    title: row.title,
    message: row.message,
    audienceType: row.audience_type,
    audienceValue: row.audience_value ?? "",
    active: row.active,
    createdAt: row.created_at,
  };
}

function normalizeMatch(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es");
}

function parseTip(
  value: unknown,
): { data: QuickTipData | null; error: string | null } {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return {
      data: null,
      error: "Los datos del consejo no son válidos.",
    };
  }

  const input = value as Record<string, unknown>;

  const title =
    typeof input.title === "string"
      ? input.title.trim()
      : "";

  const message =
    typeof input.message === "string"
      ? input.message.trim()
      : "";

  const audienceType = input.audienceType;

  const audienceValue =
    typeof input.audienceValue === "string"
      ? input.audienceValue.trim()
      : "";

  if (!title) {
    return {
      data: null,
      error: "El título es obligatorio.",
    };
  }

  if (!message) {
    return {
      data: null,
      error: "El mensaje es obligatorio.",
    };
  }

  if (
    audienceType !== "all" &&
    audienceType !== "area" &&
    audienceType !== "campaign"
  ) {
    return {
      data: null,
      error: "El público seleccionado no es válido.",
    };
  }

  if (
    audienceType !== "all" &&
    !audienceValue
  ) {
    return {
      data: null,
      error: "Debes seleccionar un área o campaña.",
    };
  }

  return {
    data: {
      title,
      message,
      audience_type: audienceType as AudienceType,
      audience_value:
        audienceType === "all" ? "" : audienceValue,
      active:
        typeof input.active === "boolean"
          ? input.active
          : true,
    },
    error: null,
  };
}

async function getSessionContext(): Promise<{
  db: SessionSupabaseClient | null;
  userId: string | null;
  profile: ProfileInfo | null;
  response: NextResponse | null;
}> {
  const db = await createSessionClient();

  const {
    data: { user },
    error: userError,
  } = await db.auth.getUser();

  if (userError || !user) {
    return {
      db: null,
      userId: null,
      profile: null,
      response: NextResponse.json(
        { error: "Debes iniciar sesión." },
        { status: 401 },
      ),
    };
  }

  const {
    data: profile,
    error: profileError,
  } = await db
    .from("profiles")
    .select("role, area, campaign")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      "[api/quick-tips] Error consultando el perfil:",
      {
        code: profileError.code,
        message: profileError.message,
      },
    );

    return {
      db: null,
      userId: null,
      profile: null,
      response: NextResponse.json(
        { error: "No se pudo verificar tu perfil." },
        { status: 500 },
      ),
    };
  }

  return {
    db,
    userId: user.id,
    profile: (profile as ProfileInfo | null) ?? null,
    response: null,
  };
}

async function getAuthorizedAdminDb(): Promise<{
  db: SessionSupabaseClient | null;
  response: NextResponse | null;
}> {
  const context = await getSessionContext();

  if (context.response) {
    return {
      db: null,
      response: context.response,
    };
  }

  if (context.profile?.role !== "admin") {
    return {
      db: null,
      response: NextResponse.json(
        { error: "No tienes permisos para administrar consejos." },
        { status: 403 },
      ),
    };
  }

  return {
    db: context.db,
    response: null,
  };
}

/*
 * GET
 * Administradores: todos los consejos.
 * Empleados: consejos activos correspondientes a su audiencia.
 */
export async function GET() {
  const context = await getSessionContext();

  if (context.response) {
    return context.response;
  }

  const { db, userId, profile } = context;

  if (!db || !userId) {
    return NextResponse.json(
      { error: "No se pudo identificar la sesión." },
      { status: 401 },
    );
  }

  const isAdmin = profile?.role === "admin";

  const query = db
    .from("quick_tips")
    .select("*")
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error(
      "[api/quick-tips] Error consultando consejos:",
      {
        code: error.code,
        message: error.message,
      },
    );

    return NextResponse.json(
      { error: "No se pudieron cargar los consejos." },
      { status: 500 },
    );
  }

  const rows = (data ?? []) as QuickTipRow[];

  /*
   * Los administradores pueden gestionar todos los consejos.
   */
  if (isAdmin) {
    return NextResponse.json(
      { tips: rows.map(toQuickTip) },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  /*
   * Para determinar la audiencia usamos primero
   * el registro laboral vinculado al usuario.
   */
  const {
    data: employee,
    error: employeeError,
  } = await db
    .from("employees")
    .select("area, campaign, employee_type")
    .eq("profile_id", userId)
    .maybeSingle();

  if (employeeError) {
    console.error(
      "[api/quick-tips] No se pudo consultar la asignación del empleado:",
      {
        code: employeeError.code,
        message: employeeError.message,
      },
    );
  }

  const employeeArea =
    employee?.area || profile?.area || "";

  const employeeCampaign =
    employee?.campaign || profile?.campaign || "";

  const visibleTips = rows.filter((tip) => {
    if (tip.audience_type === "all") {
      return true;
    }

    if (tip.audience_type === "area") {
      if (employee?.employee_type === "campana") {
        return false;
      }

      return (
        normalizeMatch(tip.audience_value) ===
        normalizeMatch(employeeArea)
      );
    }

    if (tip.audience_type === "campaign") {
      return (
        normalizeMatch(tip.audience_value) ===
        normalizeMatch(employeeCampaign)
      );
    }

    return false;
  });

  return NextResponse.json(
    { tips: visibleTips.map(toQuickTip) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/*
 * POST: solo administradores pueden crear consejos.
 */
export async function POST(request: Request) {
  const authorization = await getAuthorizedAdminDb();

  if (authorization.response) {
    return authorization.response;
  }

  const db = authorization.db;

  if (!db) {
    return NextResponse.json(
      { error: "No se pudo conectar con Supabase." },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const parsed = parseTip(body.tip);

    if (parsed.error || !parsed.data) {
      return NextResponse.json(
        { error: parsed.error || "El consejo no es válido." },
        { status: 400 },
      );
    }

    const { data, error } = await db
      .from("quick_tips")
      .insert(parsed.data)
      .select("*")
      .single();

    if (error) {
      console.error(
        "[api/quick-tips] Error creando consejo:",
        {
          code: error.code,
          message: error.message,
        },
      );

      return NextResponse.json(
        { error: "No se pudo crear el consejo." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { tip: toQuickTip(data as QuickTipRow) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudo procesar la solicitud." },
      { status: 400 },
    );
  }
}

/*
 * PATCH:
 * - active: activar/desactivar.
 * - tip: editar los datos del consejo.
 */
export async function PATCH(request: Request) {
  const authorization = await getAuthorizedAdminDb();

  if (authorization.response) {
    return authorization.response;
  }

  const db = authorization.db;

  if (!db) {
    return NextResponse.json(
      { error: "No se pudo conectar con Supabase." },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = Number(body.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "El identificador del consejo no es válido." },
        { status: 400 },
      );
    }

    let changes: Record<string, unknown>;

    if (
      body.tip === undefined &&
      typeof body.active === "boolean"
    ) {
      changes = {
        active: body.active,
        updated_at: new Date().toISOString(),
      };
    } else {
      const parsed = parseTip(body.tip);

      if (parsed.error || !parsed.data) {
        return NextResponse.json(
          { error: parsed.error || "El consejo no es válido." },
          { status: 400 },
        );
      }

      // Editar el contenido no debe reactivar un consejo desactivado.
      // El estado activo/inactivo se modifica únicamente con body.active.
      changes = {
        title: parsed.data.title,
        message: parsed.data.message,
        audience_type: parsed.data.audience_type,
        audience_value: parsed.data.audience_value,
        updated_at: new Date().toISOString(),
      };
    }

    const { data, error } = await db
      .from("quick_tips")
      .update(changes)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error(
        "[api/quick-tips] Error actualizando consejo:",
        {
          code: error.code,
          message: error.message,
        },
      );

      return NextResponse.json(
        { error: "No se pudo actualizar el consejo." },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "No encontramos ese consejo." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      tip: toQuickTip(data as QuickTipRow),
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo procesar la solicitud." },
      { status: 400 },
    );
  }
}

/*
 * DELETE: solo administradores pueden eliminar consejos.
 */
export async function DELETE(request: Request) {
  const authorization = await getAuthorizedAdminDb();

  if (authorization.response) {
    return authorization.response;
  }

  const db = authorization.db;

  if (!db) {
    return NextResponse.json(
      { error: "No se pudo conectar con Supabase." },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = Number(body.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "El identificador del consejo no es válido." },
        { status: 400 },
      );
    }

    const { data, error } = await db
      .from("quick_tips")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error(
        "[api/quick-tips] Error eliminando consejo:",
        {
          code: error.code,
          message: error.message,
        },
      );

      return NextResponse.json(
        { error: "No se pudo eliminar el consejo." },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "No encontramos ese consejo." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      id: Number(data.id),
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo procesar la solicitud." },
      { status: 400 },
    );
  }
}