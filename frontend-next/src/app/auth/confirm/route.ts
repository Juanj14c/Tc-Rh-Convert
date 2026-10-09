import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PUBLIC_ORIGIN = "https://tcrh.testbot.click";

function page(title: string, message: string, tokenHash: string) {
  const safeToken = tokenHash.replace(/"/g, "&quot;");

  return new NextResponse(
    `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #0f172a;
      color: white;
      font-family: Arial, sans-serif;
    }
    .box {
      width: min(92vw, 420px);
      padding: 32px;
      text-align: center;
      border-radius: 18px;
      background: #1e293b;
      box-sizing: border-box;
    }
    button {
      margin-top: 20px;
      padding: 12px 22px;
      border: 0;
      border-radius: 10px;
      cursor: pointer;
      font-size: 16px;
    }
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
    {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    },
  );
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  if (!tokenHash || type !== "invite") {
    return NextResponse.redirect(
      new URL("/login?error=invalid-invite", PUBLIC_ORIGIN),
    );
  }

  return page(
    "Aceptar invitación",
    "Tu invitación está lista. Pulsa el botón para continuar.",
    tokenHash,
  );
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const tokenHash = formData.get("token_hash");
  const type = formData.get("type");

  if (
    typeof tokenHash !== "string" ||
    !tokenHash ||
    type !== "invite"
  ) {
    return NextResponse.redirect(
      new URL("/login?error=invalid-invite", PUBLIC_ORIGIN),
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "invite",
  });

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=invite-expired", PUBLIC_ORIGIN),
    );
  }

  return NextResponse.redirect(
    new URL("/invite/accept", PUBLIC_ORIGIN),
    303,
  );
}
