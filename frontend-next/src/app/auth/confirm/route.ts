import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PRODUCTION_ORIGIN = "https://tcrh.testbot.click";

function getSafeAppOrigin(request: Request) {
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();

  // El callback usa el mismo origen únicamente para localhost/dev o el dominio oficial.
  // No se acepta un origen arbitrario desde parámetros del correo.
  if (url.origin === PRODUCTION_ORIGIN) return url.origin;
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") return url.origin;
  return PRODUCTION_ORIGIN;
}

function page(title: string, message: string, tokenHash: string) {
  const safeToken = tokenHash.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return new NextResponse(
    `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0f172a; color: white; font-family: Arial, sans-serif; }
    .box { width: min(92vw, 420px); padding: 32px; text-align: center; border-radius: 18px; background: #1e293b; box-sizing: border-box; }
    button { margin-top: 20px; padding: 12px 22px; border: 0; border-radius: 10px; cursor: pointer; font-size: 16px; }
  </style>
</head>
<body>
  <main class="box">
    <h1>${title}</h1>
    <p>${message}</p>
    <form method="POST">
      <input type="hidden" name="token_hash" value="${safeToken}">
      <input type="hidden" name="type" value="invite">
      <button type="submit">Aceptar invitación</button>
    </form>
  </main>
</body>
</html>`,
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const appOrigin = getSafeAppOrigin(request);

  if (!tokenHash || type !== "invite") {
    return NextResponse.redirect(new URL("/login?error=invalid-invite", appOrigin));
  }

  // La apertura de GET no consume el token. El usuario confirma con POST,
  // evitando activaciones prematuras de escáneres de correo.
  return page("Aceptar invitación", "Tu invitación está lista. Pulsa el botón para continuar.", tokenHash);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const tokenHash = formData.get("token_hash");
  const type = formData.get("type");
  const appOrigin = getSafeAppOrigin(request);

  if (typeof tokenHash !== "string" || !tokenHash || type !== "invite") {
    return NextResponse.redirect(new URL("/login?error=invalid-invite", appOrigin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "invite" });

  if (error) {
    return NextResponse.redirect(new URL("/login?error=invite-expired", appOrigin));
  }

  return NextResponse.redirect(new URL("/invite/accept", appOrigin), 303);
}
