
import { NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type AudienceType = "all" | "area" | "campaign";

interface GeneratedDraft {
  title: string;
  message: string;
}

interface OliviaResponse {
  status?: unknown;
  response?: unknown;
  detail?: unknown;
}

function parseGeneratedDraft(
  rawResponse: string,
  topic: string,
): GeneratedDraft | null {
  const cleaned = rawResponse
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  if (!cleaned) {
    return null;
  }

  // Primero intentamos interpretar la respuesta como JSON.
  const candidates = [cleaned];

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (
    firstBrace !== -1 &&
    lastBrace > firstBrace
  ) {
    candidates.push(
      cleaned.slice(firstBrace, lastBrace + 1),
    );
  }

  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(candidate);

      if (
        typeof parsed !== "object" ||
        parsed === null
      ) {
        continue;
      }

      const object = parsed as Record<string, unknown>;

      const title =
        typeof object.title === "string"
          ? object.title.trim()
          : "";

      const message =
        typeof object.message === "string"
          ? object.message.trim()
          : "";

      if (title && message) {
        return {
          title: title.slice(0, 120),
          message: message.slice(0, 1500),
        };
      }
    } catch {
      // OlivIA también podría devolver texto sin formato JSON.
    }
  }

  // Alternativa: admitir respuestas en texto con título
  // en la primera línea y contenido en las siguientes.
  const lines = cleaned
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length >= 2) {
    const title = lines[0]
      .replace(/^#{1,6}\s*/, "")
      .replace(/^t[ií]tulo\s*:\s*/i, "")
      .trim();

    const message = lines
      .slice(1)
      .join("\n")
      .replace(
        /^(?:consejo|mensaje|contenido)\s*:\s*/i,
        "",
      )
      .trim();

    if (title && message) {
      return {
        title: title.slice(0, 120),
        message: message.slice(0, 1500),
      };
    }
  }

  // Último recurso: conservar la respuesta como consejo
  // sin inventar contenido ni descartarla.
  const fallbackTitle = topic
    ? `Consejo sobre ${topic}`.slice(0, 120)
    : "Consejo de Talento & Cultura";

  return {
    title: fallbackTitle,
    message: cleaned.slice(0, 1500),
  };
}

export async function POST(request: Request) {
  try {
    // 1. Verificar la sesión del usuario.
    const supabase = await createSessionClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error:
            "Debes iniciar sesión para generar consejos.",
        },
        { status: 401 },
      );
    }

    // 2. Comprobar el rol directamente en el servidor.
    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "[quick-tips/generate] Error verificando el perfil:",
        profileError.code,
      );

      return NextResponse.json(
        {
          error:
            "No pudimos verificar tus permisos. Inténtalo nuevamente.",
        },
        { status: 500 },
      );
    }

    if (profile?.role !== "admin") {
      return NextResponse.json(
        {
          error:
            "Solo un administrador puede generar consejos con OlivIA.",
        },
        { status: 403 },
      );
    }

    // 3. Validar los datos que llegan del modal.
    let parsedBody: unknown;

    try {
      parsedBody = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "La petición contiene datos inválidos.",
        },
        { status: 400 },
      );
    }

    if (
      typeof parsedBody !== "object" ||
      parsedBody === null ||
      Array.isArray(parsedBody)
    ) {
      return NextResponse.json(
        {
          error: "Los datos de la petición no son válidos.",
        },
        { status: 400 },
      );
    }

    const body = parsedBody as Record<string, unknown>;

    const topic =
      typeof body.topic === "string"
        ? body.topic.trim().slice(0, 250)
        : "";

    const rawAudienceType =
      typeof body.audienceType === "string"
        ? body.audienceType
        : "all";

    if (
      !["all", "area", "campaign"].includes(
        rawAudienceType,
      )
    ) {
      return NextResponse.json(
        {
          error: "El público seleccionado no es válido.",
        },
        { status: 400 },
      );
    }

    const audienceType =
      rawAudienceType as AudienceType;

    const audienceValue =
      typeof body.audienceValue === "string"
        ? body.audienceValue.trim().slice(0, 100)
        : "";

    // Nuevo: recibir y validar el país de destino.
    const audienceCountry =
      typeof body.audienceCountry === "string"
        ? body.audienceCountry.trim().slice(0, 100)
        : "";

    if (
      audienceType !== "all" &&
      !audienceCountry
    ) {
      return NextResponse.json(
        {
          error: "Selecciona el país de destino.",
        },
        { status: 400 },
      );
    }

    if (
      audienceType !== "all" &&
      !audienceValue
    ) {
      return NextResponse.json(
        {
          error:
            audienceType === "area"
              ? "Selecciona un área."
              : "Selecciona una campaña.",
        },
        { status: 400 },
      );
    }

    // 4. Obtener las credenciales exclusivamente del entorno.
    const baseUrl = process.env.OLIVIA_API_URL
      ?.trim()
      .replace(/\/+$/, "");

    const apiKey = process.env.OLIVIA_API_KEY?.trim();

    if (!baseUrl || !apiKey) {
      console.error(
        "[quick-tips/generate] Faltan variables de entorno de OlivIA.",
      );

      return NextResponse.json(
        {
          error:
            "La integración con OlivIA no está configurada en el servidor.",
        },
        { status: 500 },
      );
    }

    const endpoint = baseUrl.endsWith(
      "/v1/external/chat",
    )
      ? baseUrl
      : baseUrl.endsWith("/v1/external")
        ? `${baseUrl}/chat`
        : `${baseUrl}/v1/external/chat`;

    // 5. Preparar la instrucción para generar el consejo.
    // Ahora OlivIA recibe también el país seleccionado.
    const audienceDescription =
      audienceType === "all"
        ? "todos los colaboradores"
        : audienceType === "area"
          ? `el área ${audienceValue} del país ${audienceCountry}`
          : `la campaña ${audienceValue} del país ${audienceCountry}`;

    const topicInstruction = topic
      ? `Tema solicitado: ${topic}.`
      : "Elige un tema útil y cotidiano relacionado con el entorno laboral.";

    const prompt = [
      "Eres OlivIA, asistente de Talento y Cultura.",
      "Genera un consejo breve, práctico, respetuoso e inclusivo para colaboradores.",
      topicInstruction,
      `Público objetivo: ${audienceDescription}.`,
      "Ten en cuenta el país y la audiencia laboral indicada para contextualizar el consejo.",
      "No confundas campañas de países diferentes aunque tengan nombres similares.",
      "Usa español claro y natural.",
      "El título debe ser breve.",
      "El contenido debe ser útil, concreto y fácil de aplicar.",
      "No inventes políticas internas, cifras ni beneficios de la empresa.",
      "No incluyas datos personales ni información confidencial.",
      'Devuelve exclusivamente un objeto JSON válido con esta estructura: {"title":"Título del consejo","message":"Contenido del consejo"}.',
      "No añadas bloques Markdown ni explicaciones fuera del JSON.",
    ].join("\n");

    // 6. Consumir la API de OlivIA desde el backend.
    // No enviamos campaign_id: el público de Tc-Rh-Convert
    // no es lo mismo que una campaña configurada en OlivIA.
    const controller = new AbortController();

    const timeoutId = setTimeout(
      () => controller.abort(),
      65_000,
    );

    let upstreamResponse: Response;

    try {
      upstreamResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-API-Key": apiKey,
        },
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({
          end_user_id: user.id,
          message: prompt,
        }),
      });
    } catch (error) {
      if (controller.signal.aborted) {
        return NextResponse.json(
          {
            error:
              "OlivIA está tardando demasiado en responder. Inténtalo nuevamente.",
          },
          { status: 504 },
        );
      }

      console.error(
        "[quick-tips/generate] Error de conexión con OlivIA:",
        error instanceof Error
          ? error.name
          : "Error desconocido",
      );

      return NextResponse.json(
        {
          error:
            "No pudimos conectar con OlivIA. Verifica la conexión e inténtalo nuevamente.",
        },
        { status: 502 },
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const upstreamData =
      (await upstreamResponse
        .json()
        .catch(() => null)) as OliviaResponse | null;

    if (!upstreamResponse.ok) {
      console.error(
        "[quick-tips/generate] OlivIA respondió con HTTP",
        upstreamResponse.status,
      );

      if (upstreamResponse.status === 401) {
        return NextResponse.json(
          {
            error:
              "OlivIA rechazó la API key. Verifica que la clave local esté activa y tenga los permisos necesarios.",
          },
          { status: 502 },
        );
      }

      if (upstreamResponse.status === 422) {
        return NextResponse.json(
          {
            error:
              "OlivIA no aceptó los datos enviados. Debemos revisar el formato de la petición.",
          },
          { status: 502 },
        );
      }

      if (upstreamResponse.status >= 500) {
        return NextResponse.json(
          {
            error:
              "OlivIA presentó un error interno. Inténtalo nuevamente en unos segundos.",
          },
          { status: 502 },
        );
      }

      return NextResponse.json(
        {
          error:
            "OlivIA no pudo completar la solicitud.",
        },
        { status: 502 },
      );
    }

    // 7. Interpretar el texto generado y devolverlo al modal.
    const generatedText =
      typeof upstreamData?.response === "string"
        ? upstreamData.response
        : "";

    const draft = parseGeneratedDraft(
      generatedText,
      topic,
    );

    if (!draft) {
      return NextResponse.json(
        {
          error:
            "OlivIA no devolvió un consejo válido. Inténtalo nuevamente.",
        },
        { status: 502 },
      );
    }

    // Importante: aquí no se guarda ni se publica el consejo.
    return NextResponse.json({ draft });
  } catch (error) {
    console.error(
      "[quick-tips/generate] Error interno:",
      error instanceof Error
        ? error.message
        : "Error desconocido",
    );

    return NextResponse.json(
      {
        error:
          "Ocurrió un error al preparar el borrador. Inténtalo nuevamente.",
      },
      { status: 500 },
    );
  }
}
