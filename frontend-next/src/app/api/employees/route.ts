import { NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase/server";

type EmployeeType = "planta" | "campana";

type EmployeeRow = {
  id: number;
  profile_id: string | null;
  name: string;
  last_name: string | null;
  email: string;
  country_code: string | null;
  country_name: string | null;
  work_center: string | null;
  area: string | null;
  team: string | null;
  position: string | null;
  gender: string | null;
  hire_date: string | null;
  birth_date: string | null;
  nationality: string | null;
  campaign: string | null;
  employee_type: EmployeeType | null;
  image: string | null;
  active: boolean;
  invitation_status: string | null;
};

type SessionSupabaseClient = Awaited<ReturnType<typeof createSessionClient>>;

function normalizeDisplayText(value: unknown): string {
  const raw = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (!raw || /^(?:n\/?a|n\.a\.|—|-|no aplica)$/i.test(raw)) return "";

  return raw
    .toLocaleLowerCase("es")
    .replace(/(^|[\s\-'’])(\p{L})/gu, (_match, separator: string, letter: string) =>
      separator + letter.toLocaleUpperCase("es"),
    );
}

function normalizeGender(value: unknown): string {
  const normalized = normalizeDisplayText(value)
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (["f", "femenino", "femenina", "mujer", "female"].includes(normalized)) return "Femenino";
  if (["m", "masculino", "hombre", "male"].includes(normalized)) return "Masculino";
  if (["no especificado", "no especificada", "prefiero no decir"].includes(normalized)) return "No especificado";
  return normalizeDisplayText(value);
}

function nullableDisplayText(value: unknown): string | null {
  return normalizeDisplayText(value) || null;
}

function toEmployee(row: EmployeeRow) {
  return {
    id: Number(row.id),
    name: normalizeDisplayText(row.name),
    lastName: normalizeDisplayText(row.last_name),
    email: (row.email ?? "").trim().toLowerCase(),
    countryCode: (row.country_code || "CO") as "CO" | "MX" | "ES" | "UY" | "PE",
    countryName: normalizeDisplayText(row.country_name),
    workCenter: normalizeDisplayText(row.work_center),
    area: (row.area ?? "").trim().replace(/\s+/g, " ").toLocaleUpperCase("es"),
    team: normalizeDisplayText(row.team),
    position: normalizeDisplayText(row.position),
    gender: normalizeGender(row.gender),
    hireDate: row.hire_date ?? "",
    birthDate: row.birth_date ?? "",
    nationality: normalizeDisplayText(row.nationality),
    campaign: (row.campaign ?? "").trim().replace(/\s+/g, " ").toLocaleUpperCase("es"),
    employeeType: row.employee_type === "planta" || row.employee_type === "campana" ? row.employee_type : null,
    image: row.image ?? "",
    active: row.active,
    profileId: row.profile_id ?? null,
    invitationStatus: row.invitation_status ?? "not_sent",
  };
}

function textValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value: unknown): string | null {
  const text = textValue(value);
  if (!text || /^(?:n\/?a|n\.a\.|—|-|no aplica)$/i.test(text)) return null;
  return text;
}

function toDbEmployee(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Los datos del empleado no son válidos.");
  }

  const employee = value as Record<string, unknown>;
  const name = normalizeDisplayText(employee.name);
  const email = textValue(employee.email).toLowerCase();
  const employeeTypeRaw = employee.employeeType;

  // Compatibilidad con clientes anteriores solo cuando el campo no se envía.
  // Un registro pendiente (employeeType: null) debe clasificarse de forma explícita.
  let employeeType: EmployeeType;
  if (employeeTypeRaw === undefined) {
    employeeType = "planta";
  } else if (employeeTypeRaw === "planta" || employeeTypeRaw === "campana") {
    employeeType = employeeTypeRaw;
  } else {
    throw new Error("Selecciona si el empleado pertenece a Planta o Campañas.");
  }

  const area = (nullableText(employee.area) ?? "").replace(/\s+/g, " ").toLocaleUpperCase("es");
  const campaign = (nullableText(employee.campaign) ?? "")
    .replace(/\s+/g, " ")
    .toLocaleUpperCase("es");
  if (!name || !email) {
    throw new Error("Nombre y correo son obligatorios.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Ingresa un correo electrónico válido.");
  }
  if (employeeType === "planta" && !area) {
    throw new Error("El área es obligatoria para empleados de Planta.");
  }
  if (employeeType === "campana" && !campaign) {
    throw new Error("La campaña es obligatoria para empleados de Campañas.");
  }

  return {
    name,
    last_name: nullableDisplayText(employee.lastName),
    email,
    country_code: nullableText(employee.countryCode),
    country_name: nullableDisplayText(employee.countryName),
    work_center: nullableDisplayText(employee.workCenter),
    area: nullableText(area),
    team: employeeType === "campana" ? null : nullableDisplayText(employee.team),
    position: nullableDisplayText(employee.position),
    gender: nullableDisplayText(normalizeGender(employee.gender)),
    hire_date: nullableText(employee.hireDate),
    birth_date: nullableText(employee.birthDate),
    nationality: nullableDisplayText(employee.nationality),
    campaign: nullableText(campaign),
    employee_type: employeeType,
    image: nullableText(employee.image),
    active: typeof employee.active === "boolean" ? employee.active : true,
  };
}

async function getAuthorizedAdminDb(): Promise<{
  db: SessionSupabaseClient | null;
  response: NextResponse | null;
}> {
  const sessionClient = await createSessionClient();
  const {
    data: { user },
    error: userError,
  } = await sessionClient.auth.getUser();

  if (userError || !user) {
    return {
      db: null,
      response: NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await sessionClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return {
      db: null,
      response: NextResponse.json({ error: "No tienes permisos para administrar empleados." }, { status: 403 }),
    };
  }

  return { db: sessionClient, response: null };
}

function databaseError(error: { code?: string; message?: string; details?: string; hint?: string }) {
  console.error("[api/employees] Error de Supabase:", {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });

  if (error.code === "23505") {
    return NextResponse.json({ error: "Ya existe un empleado con ese correo." }, { status: 409 });
  }
  if (error.code === "42501") {
    return NextResponse.json({ error: "No tienes permisos para realizar esta operación." }, { status: 403 });
  }
  if (error.code === "42703" || error.code === "PGRST204") {
    return NextResponse.json({ error: "Falta actualizar el esquema de la tabla employees en la base de pruebas. Ejecuta primero la migración SQL entregada." }, { status: 500 });
  }
  return NextResponse.json({ error: "No se pudo completar la operación en la base de datos." }, { status: 500 });
}

export async function GET() {
  const authorization = await getAuthorizedAdminDb();
  if (authorization.response) return authorization.response;
  const db = authorization.db;
  if (!db) return NextResponse.json({ error: "No se pudo conectar con Supabase." }, { status: 500 });

  const { data, error } = await db.from("employees").select("*").order("created_at", { ascending: false });
  if (error) return databaseError(error);

  return NextResponse.json({ employees: ((data ?? []) as EmployeeRow[]).map(toEmployee) });
}

export async function POST(request: Request) {
  const authorization = await getAuthorizedAdminDb();
  if (authorization.response) return authorization.response;
  const db = authorization.db;
  if (!db) return NextResponse.json({ error: "No se pudo conectar con Supabase." }, { status: 500 });

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const rawEmployees = Array.isArray(body.employees) ? body.employees : body.employee ? [body.employee] : [];
    if (rawEmployees.length === 0) {
      return NextResponse.json({ error: "No se recibieron empleados para guardar." }, { status: 400 });
    }

    const employeesToInsert = rawEmployees.map((employee) => ({
      ...toDbEmployee(employee),
      profile_id: null,
      invitation_status: "not_sent",
    }));
    const { data, error } = await db.from("employees").insert(employeesToInsert).select("*");
    if (error) return databaseError(error);

    return NextResponse.json({ employees: ((data ?? []) as EmployeeRow[]).map(toEmployee) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Los datos enviados no son válidos." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const authorization = await getAuthorizedAdminDb();
  if (authorization.response) return authorization.response;
  const db = authorization.db;
  if (!db) return NextResponse.json({ error: "No se pudo conectar con Supabase." }, { status: 500 });

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = Number(body.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json({ error: "El identificador del empleado no es válido." }, { status: 400 });
    }

    let changes: Record<string, unknown>;
    if (typeof body.active === "boolean" && body.employee === undefined) {
      changes = { active: body.active, updated_at: new Date().toISOString() };
    } else {
      changes = { ...toDbEmployee(body.employee), updated_at: new Date().toISOString() };
    }

    const { data, error } = await db.from("employees").update(changes).eq("id", id).select("*").maybeSingle();
    if (error) return databaseError(error);
    if (!data) return NextResponse.json({ error: "No encontramos ese empleado." }, { status: 404 });

    return NextResponse.json({ employee: toEmployee(data as EmployeeRow) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Los datos enviados no son válidos." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const authorization = await getAuthorizedAdminDb();
  if (authorization.response) return authorization.response;
  const db = authorization.db;
  if (!db) return NextResponse.json({ error: "No se pudo conectar con Supabase." }, { status: 500 });

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = Number(body.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json({ error: "El identificador del empleado no es válido." }, { status: 400 });
    }

    const { data, error } = await db.from("employees").delete().eq("id", id).select("id").maybeSingle();
    if (error) return databaseError(error);
    if (!data) return NextResponse.json({ error: "No encontramos ese empleado o no tienes permiso para eliminarlo." }, { status: 404 });

    return NextResponse.json({ success: true, id: Number(data.id) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo eliminar el empleado." }, { status: 400 });
  }
}
