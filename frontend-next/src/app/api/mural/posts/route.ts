import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createClient as createSessionClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MEDIA_BUCKET = "mural-media";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_MEDIA_BYTES = 50 * 1024 * 1024;

type Audience = "all" | "campaign" | "area" | "country";
type Reaction = "like" | "dislike" | null;
type SessionDb = Awaited<ReturnType<typeof createSessionClient>>;

type AttachmentInput = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
  storagePath?: string;
};

type PostInput = {
  title: string;
  content: string;
  audience: Audience;
  audienceValue: string;
  country: string | null;
  area: string | null;
  campaign: string | null;
  image: string;
  imagePath: string | null;
  link: string | null;
  attachments: AttachmentInput[];
};

type PostRow = {
  id: number;
  title: string;
  content: string;
  author: string;
  created_by: string | null;
  audience_type: Audience;
  audience_value: string;
  country: string | null;
  area: string | null;
  campaign: string | null;
  image_path: string | null;
  link: string | null;
  attachments: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    storage_path: string;
  }> | null;
  created_at: string;
};

const attachmentMimeByExtension: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  zip: "application/zip",
};

const allowedImageMimes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const allowedAttachmentMimes = new Set(Object.values(attachmentMimeByExtension));

function textValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown): string | null {
  const valueText = textValue(value);
  return valueText || null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeAudience(value: unknown): value is Audience {
  return value === "all" || value === "campaign" || value === "area" || value === "country";
}

function parsePost(value: unknown): { data: PostInput | null; error: string | null } {
  if (!isRecord(value)) {
    return { data: null, error: "Los datos de la publicación no son válidos." };
  }

  const title = textValue(value.title);
  const content = textValue(value.content);
  const audience = value.audience;
  const audienceValue = textValue(value.audienceValue);
  const country = optionalText(value.country);
  const area = optionalText(value.area);
  const campaign = optionalText(value.campaign);
  const image = typeof value.image === "string" ? value.image.trim() : "";
  const imagePath = optionalText(value.imagePath);
  const rawLink = textValue(value.link);
  const attachmentsRaw = value.attachments === undefined ? [] : value.attachments;

  if (!title || title.length > 180) {
    return { data: null, error: "El título es obligatorio y debe tener máximo 180 caracteres." };
  }
  if (!content || content.length > 50000) {
    return { data: null, error: "El contenido es obligatorio y debe tener máximo 50.000 caracteres." };
  }
  if (!normalizeAudience(audience)) {
    return { data: null, error: "El público seleccionado no es válido." };
  }
  if (audience === "campaign" && (!country || !campaign)) {
    return { data: null, error: "Selecciona el país y la campaña." };
  }
  if (audience === "area" && !area) {
    return { data: null, error: "Selecciona el área para esta publicación." };
  }
  if (audience === "country" && !country) {
    return { data: null, error: "Selecciona el país para esta publicación." };
  }
  if (!Array.isArray(attachmentsRaw) || attachmentsRaw.length > 30) {
    return { data: null, error: "La publicación admite máximo 30 archivos adjuntos." };
  }

  let link: string | null = null;
  if (rawLink) {
    try {
      const parsedUrl = new URL(rawLink);
      if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
        return { data: null, error: "El enlace debe comenzar con http:// o https://." };
      }
      link = parsedUrl.toString();
    } catch {
      return { data: null, error: "El enlace no tiene un formato válido." };
    }
  }

  const attachments: AttachmentInput[] = [];
  for (const attachment of attachmentsRaw) {
    if (!isRecord(attachment)) {
      return { data: null, error: "Uno de los archivos adjuntos no es válido." };
    }
    const id = textValue(attachment.id);
    const name = textValue(attachment.name);
    const type = textValue(attachment.type);
    const size = Number(attachment.size);
    const dataUrl = typeof attachment.dataUrl === "string" ? attachment.dataUrl : "";
    const storagePath = optionalText(attachment.storagePath);

    if (!id || !name || !Number.isFinite(size) || size < 0 || size > MAX_ATTACHMENT_BYTES) {
      return { data: null, error: `El archivo "${name || "sin nombre"}" no es válido o supera 10 MB.` };
    }
    attachments.push({ id, name, type, size, dataUrl, storagePath: storagePath ?? undefined });
  }

  return {
    data: {
      title,
      content,
      audience,
      audienceValue: audience === "all" ? "" : audienceValue || (audience === "campaign" ? campaign ?? "" : audience === "area" ? area ?? "" : country ?? ""),
      country: audience === "campaign" || audience === "country" ? country : null,
      area: audience === "area" ? area : null,
      campaign: audience === "campaign" ? campaign : null,
      image,
      imagePath,
      link,
      attachments,
    },
    error: null,
  };
}

async function getSessionContext(): Promise<{
  db: SessionDb | null;
  userId: string | null;
  isAdmin: boolean;
  response: NextResponse | null;
}> {
  const db = await createSessionClient();
  const { data: { user }, error: userError } = await db.auth.getUser();
  if (userError || !user) {
    return {
      db: null,
      userId: null,
      isAdmin: false,
      response: NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[api/mural/posts] No se pudo verificar el perfil:", profileError.message);
    return {
      db: null,
      userId: null,
      isAdmin: false,
      response: NextResponse.json({ error: "No se pudo verificar tu perfil." }, { status: 500 }),
    };
  }

  return { db, userId: user.id, isAdmin: profile?.role === "admin", response: null };
}

function requireAdmin(context: Awaited<ReturnType<typeof getSessionContext>>) {
  if (context.response) return context.response;
  if (!context.isAdmin) {
    return NextResponse.json({ error: "Solo Talento & Cultura puede administrar publicaciones." }, { status: 403 });
  }
  return null;
}

function parseDataUrl(value: string): { mime: string; buffer: Buffer } | null {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(value);
  if (!match?.[1] || !match[2]) return null;
  const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (buffer.length === 0) return null;
  return { mime: match[1].toLowerCase(), buffer };
}

function inferAttachmentMime(attachment: AttachmentInput, declaredMime: string): string {
  if (allowedAttachmentMimes.has(declaredMime)) return declaredMime;
  const extension = attachment.name.split(".").pop()?.toLowerCase() ?? "";
  return attachmentMimeByExtension[extension] ?? "";
}

function extensionForMime(mime: string): string {
  const defaultExtensions: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
    "application/pdf": "pdf", "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "text/plain": "txt", "application/zip": "zip",
  };
  return defaultExtensions[mime] ?? "bin";
}

async function uploadDataUrl(
  db: SessionDb,
  userId: string,
  dataUrl: string,
  kind: "image" | "attachment",
  uploadedPaths: string[],
  fileName: string = "",
): Promise<string> {
  const decoded = parseDataUrl(dataUrl);
  if (!decoded) throw new Error("No se pudo leer uno de los archivos. Vuelve a seleccionarlo.");

  let mime = decoded.mime;
  if (kind === "attachment") mime = inferAttachmentMime({ id: "", name: fileName, type: mime, size: decoded.buffer.length }, mime);
  const allowed = kind === "image" ? allowedImageMimes : allowedAttachmentMimes;
  if (!allowed.has(mime)) {
    throw new Error(kind === "image"
      ? "La imagen debe ser PNG, JPG o WEBP."
      : `El archivo "${fileName}" tiene un formato no permitido.`);
  }
  const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_ATTACHMENT_BYTES;
  if (decoded.buffer.length > maxBytes) {
    throw new Error(kind === "image"
      ? "La imagen no puede superar los 5 MB."
      : `El archivo "${fileName}" supera los 10 MB.`);
  }

  const extension = extensionForMime(mime);
  const filePath = `${userId}/posts/${randomUUID()}.${extension}`;
  const { error } = await db.storage.from(MEDIA_BUCKET).upload(filePath, decoded.buffer, {
    contentType: mime,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    console.error("[api/mural/posts] Error subiendo archivo:", error.message);
    throw new Error("No se pudo subir uno de los archivos del Mural.");
  }
  uploadedPaths.push(filePath);
  return filePath;
}

async function removeStoragePaths(db: SessionDb, paths: string[]) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  if (uniquePaths.length === 0) return;
  const { error } = await db.storage.from(MEDIA_BUCKET).remove(uniquePaths);
  if (error) console.error("[api/mural/posts] No se pudieron limpiar algunos archivos:", error.message);
}

function rowMediaPaths(row: PostRow | null | undefined): string[] {
  if (!row) return [];
  const paths = row.image_path ? [row.image_path] : [];
  for (const attachment of row.attachments ?? []) {
    if (attachment?.storage_path) paths.push(attachment.storage_path);
  }
  return paths;
}

async function buildDbPost(
  db: SessionDb,
  userId: string,
  input: PostInput,
  previous: PostRow | null,
  uploadedPaths: string[],
) {
  const previousPaths = new Set(rowMediaPaths(previous));
  let imagePath: string | null = null;

  // Imagen de la publicación.
  if (input.image.startsWith("data:")) {
    imagePath = await uploadDataUrl(
      db,
      userId,
      input.image,
      "image",
      uploadedPaths,
    );
  } else if (input.imagePath) {
    // Solo conservar una imagen que ya pertenezca a la publicación.
    if (!previousPaths.has(input.imagePath)) {
      throw new Error("La ruta de la imagen no es válida.");
    }

    imagePath = input.imagePath;
  } else if (input.image && previous?.image_path) {
    // Conservar la imagen existente al editar.
    imagePath = previous.image_path;
  }

  // Archivos adjuntos.
  let totalAttachmentBytes = 0;

  const attachments: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    storage_path: string;
  }> = [];

  for (const attachment of input.attachments) {
    let storagePath: string;

    if (
      attachment.storagePath &&
      previousPaths.has(attachment.storagePath) &&
      attachment.storagePath !== previous?.image_path
    ) {
      // Conservar un adjunto previamente vinculado.
      storagePath = attachment.storagePath;
    } else if (attachment.dataUrl?.startsWith("data:")) {
      // Subir un adjunto nuevo y guardar su ruta.
      const path = await uploadDataUrl(
        db,
        userId,
        attachment.dataUrl,
        "attachment",
        uploadedPaths,
        attachment.name,
      );

      storagePath = path;
    } else {
      throw new Error(
        `No se reconoce el archivo "${attachment.name}". Vuelve a adjuntarlo.`,
      );
    }

    totalAttachmentBytes += attachment.size;

    if (totalAttachmentBytes > MAX_TOTAL_MEDIA_BYTES) {
      throw new Error(
        "El tamaño total de los archivos adjuntos no puede superar 50 MB.",
      );
    }

    attachments.push({
      id: attachment.id,
      name: attachment.name,
      type: attachment.type || "application/octet-stream",
      size: attachment.size,
      storage_path: storagePath,
    });
  }

  return {
    title: input.title,
    content: input.content,
    author: "Talento & Cultura",
    audience_type: input.audience,
    audience_value: input.audienceValue,
    country: input.country,
    area: input.area,
    campaign: input.campaign,
    image_path: imagePath,
    link: input.link,
    attachments,
    updated_at: new Date().toISOString(),
  };
}

function formatPostDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(date);
}

async function toClientPosts(db: SessionDb, rows: PostRow[], userId: string) {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => Number(row.id));
  const [{ data: ownReactions, error: ownReactionError }, { data: counts, error: countsError }] = await Promise.all([
    db.from("mural_post_reactions").select("post_id, reaction").eq("user_id", userId).in("post_id", ids),
    db.rpc("mural_post_reaction_counts", { post_ids: ids }),
  ]);
  if (ownReactionError) {
    // Un problema de reacciones no debe ocultar publicaciones que sí se cargaron.
    console.error("[api/mural/posts] Error consultando reacciones propias:", ownReactionError.message);
  }
  if (countsError) {
    console.error("[api/mural/posts] Error calculando reacciones:", countsError.message);
  }

  const ownReactionByPost = new Map<number, Reaction>();
  for (const reaction of ownReactions ?? []) {
    ownReactionByPost.set(Number(reaction.post_id), reaction.reaction === "like" ? "like" : "dislike");
  }
  const countsByPost = new Map<number, { likes: number; dislikes: number }>();
  for (const item of (counts ?? []) as Array<{ post_id: number; likes: number; dislikes: number }>) {
    countsByPost.set(Number(item.post_id), { likes: Number(item.likes), dislikes: Number(item.dislikes) });
  }

  const allPaths = new Set<string>();
  for (const row of rows) {
    if (row.image_path) allPaths.add(row.image_path);
    for (const attachment of row.attachments ?? []) {
      if (attachment.storage_path) allPaths.add(attachment.storage_path);
    }
  }
  const signedUrls = new Map<string, string>();
  await Promise.all([...allPaths].map(async (path) => {
    const { data, error } = await db.storage.from(MEDIA_BUCKET).createSignedUrl(path, 60 * 60);
    if (error) {
      console.error("[api/mural/posts] No se pudo generar URL temporal para un archivo:", error.message);
      return;
    }
    signedUrls.set(path, data.signedUrl);
  }));

  return rows.map((row) => {
    const countsForPost = countsByPost.get(Number(row.id)) ?? { likes: 0, dislikes: 0 };
    return {
      id: Number(row.id),
      title: row.title,
      content: row.content,
      author: row.author,
      date: formatPostDate(row.created_at),
      createdAt: row.created_at,
      likes: countsForPost.likes,
      dislikes: countsForPost.dislikes,
      myReaction: ownReactionByPost.get(Number(row.id)) ?? null,
      audience: row.audience_type,
      audienceValue: row.audience_value ?? "",
      country: row.country ?? undefined,
      area: row.area ?? undefined,
      campaign: row.campaign ?? undefined,
      imagePath: row.image_path ?? undefined,
      image: row.image_path ? signedUrls.get(row.image_path) : undefined,
      link: row.link ?? undefined,
      attachments: (row.attachments ?? []).map((attachment) => ({
        id: attachment.id,
        name: attachment.name,
        type: attachment.type,
        size: Number(attachment.size),
        storagePath: attachment.storage_path,
        dataUrl: signedUrls.get(attachment.storage_path) ?? "",
      })),
    };
  });
}

function databaseError(error: { code?: string; message?: string }) {
  console.error("[api/mural/posts] Error de Supabase:", { code: error.code, message: error.message });
  if (error.code === "42501") {
    return NextResponse.json({ error: "No tienes permisos para realizar esta operación." }, { status: 403 });
  }
  if (["42P01", "PGRST205", "42883", "42703", "PGRST204"].includes(error.code ?? "")) {
    return NextResponse.json({ error: "Falta aplicar o revisar la migración del Mural en la Supabase de pruebas." }, { status: 500 });
  }
  return NextResponse.json({ error: "No se pudo completar la operación en Supabase." }, { status: 500 });
}

export async function GET() {
  const context = await getSessionContext();
  if (context.response) return context.response;
  if (!context.db || !context.userId) {
    return NextResponse.json({ error: "No se pudo identificar la sesión." }, { status: 401 });
  }

  const { data, error } = await context.db
    .from("mural_posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return databaseError(error);

  try {
    const posts = await toClientPosts(context.db, (data ?? []) as PostRow[], context.userId);
    return NextResponse.json({ posts }, { headers: { "Cache-Control": "no-store" } });
  } catch (conversionError) {
    console.error("[api/mural/posts] Error preparando el Mural:", conversionError);
    return NextResponse.json({ error: conversionError instanceof Error ? conversionError.message : "No se pudieron preparar las publicaciones." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const context = await getSessionContext();
  const authorizationError = requireAdmin(context);
  if (authorizationError) return authorizationError;
  if (!context.db || !context.userId) {
    return NextResponse.json({ error: "No se pudo identificar la sesión." }, { status: 401 });
  }

  const uploadedPaths: string[] = [];
  let persisted = false;
  try {
    const body = await request.json() as Record<string, unknown>;
    const parsed = parsePost(body.post);
    if (parsed.error || !parsed.data) {
      return NextResponse.json({ error: parsed.error || "La publicación no es válida." }, { status: 400 });
    }
    const postData = await buildDbPost(context.db, context.userId, parsed.data, null, uploadedPaths);
    const { data, error } = await context.db
      .from("mural_posts")
      .insert({ ...postData, created_by: context.userId })
      .select("*")
      .single();
    if (error) {
      await removeStoragePaths(context.db, uploadedPaths);
      return databaseError(error);
    }
    persisted = true;
    const [post] = await toClientPosts(context.db, [data as PostRow], context.userId);
    return NextResponse.json({ post }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (!persisted) await removeStoragePaths(context.db, uploadedPaths);
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo crear la publicación." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const context = await getSessionContext();
  const authorizationError = requireAdmin(context);
  if (authorizationError) return authorizationError;
  if (!context.db || !context.userId) {
    return NextResponse.json({ error: "No se pudo identificar la sesión." }, { status: 401 });
  }

  const uploadedPaths: string[] = [];
  let persisted = false;
  try {
    const body = await request.json() as Record<string, unknown>;
    const id = Number(body.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json({ error: "El identificador de la publicación no es válido." }, { status: 400 });
    }
    const parsed = parsePost(body.post);
    if (parsed.error || !parsed.data) {
      return NextResponse.json({ error: parsed.error || "La publicación no es válida." }, { status: 400 });
    }

    const { data: previousData, error: previousError } = await context.db
      .from("mural_posts").select("*").eq("id", id).maybeSingle();
    if (previousError) return databaseError(previousError);
    if (!previousData) return NextResponse.json({ error: "No encontramos esa publicación." }, { status: 404 });
    const previous = previousData as PostRow;

    const postData = await buildDbPost(context.db, context.userId, parsed.data, previous, uploadedPaths);
    const { data, error } = await context.db
      .from("mural_posts").update(postData).eq("id", id).select("*").single();
    if (error) {
      await removeStoragePaths(context.db, uploadedPaths);
      return databaseError(error);
    }
    persisted = true;

    const updated = data as PostRow;
    const retainedPaths = new Set(rowMediaPaths(updated));
    await removeStoragePaths(context.db, rowMediaPaths(previous).filter((path) => !retainedPaths.has(path)));
    const [post] = await toClientPosts(context.db, [updated], context.userId);
    return NextResponse.json({ post }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (!persisted) await removeStoragePaths(context.db, uploadedPaths);
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo actualizar la publicación." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const context = await getSessionContext();
  const authorizationError = requireAdmin(context);
  if (authorizationError) return authorizationError;
  if (!context.db) {
    return NextResponse.json({ error: "No se pudo conectar con Supabase." }, { status: 500 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const id = Number(body.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json({ error: "El identificador de la publicación no es válido." }, { status: 400 });
    }
    const { data: previous, error: previousError } = await context.db
      .from("mural_posts").select("*").eq("id", id).maybeSingle();
    if (previousError) return databaseError(previousError);
    if (!previous) return NextResponse.json({ error: "No encontramos esa publicación." }, { status: 404 });

    const { error } = await context.db.from("mural_posts").delete().eq("id", id);
    if (error) return databaseError(error);
    await removeStoragePaths(context.db, rowMediaPaths(previous as PostRow));
    return NextResponse.json({ success: true, id });
  } catch {
    return NextResponse.json({ error: "No se pudo procesar la solicitud." }, { status: 400 });
  }
}
