import { NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getSafeAppOrigin(request: Request) {
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();

  // Permitir el dominio de producción y servidores de desarrollo locales.
  if (url.origin === "https://tcrh.testbot.click") return url.origin;
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") return url.origin;

  return "https://tcrh.testbot.click";
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  // Primero validar sesión y rol con el cliente ligado a las cookies del administrador.
  const sessionDb = await createSessionClient();
  const {
    data: { user },
    error: userError,
  } = await sessionDb.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await sessionDb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return NextResponse.json(
      { error: "No tienes permisos para invitar empleados." },
      { status: 403 },
    );
  }

  const { id: rawId } = await context.params;
  const employeeId = Number(rawId);
  if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
    return NextResponse.json({ error: "El identificador del empleado no es válido." }, { status: 400 });
  }

  let adminDb;
  try {
    adminDb = createAdminClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falta configurar el cliente administrativo." },
      { status: 500 },
    );
  }

  const { data: employee, error: employeeError } = await adminDb
    .from("employees")
    .select("id, profile_id, name, last_name, email, country_name,area,campaign, active, invitation_status")
    .eq("id", employeeId)
    .maybeSingle();

  if (employeeError) {
    console.error("[api/employees/invite] No se pudo consultar el empleado:", employeeError.message);
    return NextResponse.json(
      { error: "No se pudo consultar el empleado. Comprueba que la migración de empleados esté aplicada en la base de pruebas." },
      { status: 500 },
    );
  }

  if (!employee) {
    return NextResponse.json({ error: "No encontramos ese empleado." }, { status: 404 });
  }

  if (!employee.active) {
    return NextResponse.json({ error: "No se puede invitar a un empleado inactivo." }, { status: 409 });
  }

  const currentStatus = String(employee.invitation_status ?? "not_sent").trim().toLowerCase();
  if (employee.profile_id || ["sent","pending", "accepted"].includes(currentStatus)) {
    const message = currentStatus === "accepted"
      ? "Este empleado ya aceptó la invitación."
      : "Este empleado ya tiene una invitación o una cuenta vinculada. No se enviará otra invitación para evitar duplicarla.";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  const email = String(employee.email ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "El empleado no tiene un correo electrónico válido." }, { status: 400 });
  }

  const fullName = [employee.name, employee.last_name]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ");

  // redirectTo apunta a la ruta de confirmación que protege el token frente a escáneres de correo.
  const appOrigin = getSafeAppOrigin(request);
  const redirectTo = new URL("/auth/confirm", appOrigin).toString();
  const {
    data: inviteData, error: inviteError } = await adminDb.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      name: fullName,
      full_name: fullName,
      display_name: fullName,
      country: employee.country_name,
      area: employee.area,
      campaign: employee.campaign,
    },
  });

  if (inviteError || !inviteData.user?.id) {
    const message = inviteError?.message.toLowerCase() ?? "";
    if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
      return NextResponse.json(
        { error: "Ya existe una cuenta de autenticación con ese correo. No se envió una invitación nueva." },
        { status: 409 },
      );
    }

    console.error("[api/employees/invite] Error enviando invitación:", inviteError?.message ?? "Supabase no devolvió el usuario.");
    return NextResponse.json(
      { error: "Supabase no pudo enviar la invitación. Revisa la configuración del correo de invitación y vuelve a intentarlo." },
      { status: 500 },
    );
  }

  // Relacionar la ficha con el usuario de Auth y registrar el envío.
  // Si esta actualización falla, no borrar el usuario: el correo pudo haberse enviado.
  const { data: updatedEmployee, error: updateError } = await adminDb
    .from("employees")
    .update({
      profile_id: inviteData.user.id,
      invitation_status: "sent",
      updated_at: new Date().toISOString(),
    })
    .eq("id", employeeId)
    .select("id, profile_id, invitation_status")
    .single();

  if (updateError || !updatedEmployee) {
    console.error("[api/employees/invite] La invitación pudo enviarse, pero no se guardó el estado:", updateError?.message ?? "Sin fila actualizada");
    return NextResponse.json(
      { error: "La invitación pudo haberse enviado, pero no se pudo guardar su estado en employees. No vuelvas a pulsar Invitar todavía; revisa la base de pruebas." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    employee: {
      id: Number(updatedEmployee.id),
      profileId: updatedEmployee.profile_id ?? null,
      invitationStatus: updatedEmployee.invitation_status ?? "sent",
    },
  });
}
