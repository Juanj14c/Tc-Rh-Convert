import { NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Reaction = "like" | "dislike" | null;
type SessionDb = Awaited<ReturnType<typeof createSessionClient>>;

export async function POST(request: Request) {
  const db: SessionDb = await createSessionClient();
  const {
    data: { user },
    error: userError,
  } = await db.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "La solicitud no es válida." }, { status: 400 });
  }

  const postId = Number(body.postId);
  const requestedReaction = body.reaction;
  if (!Number.isSafeInteger(postId) || postId <= 0) {
    return NextResponse.json({ error: "La publicación seleccionada no es válida." }, { status: 400 });
  }
  if (requestedReaction !== null && requestedReaction !== "like" && requestedReaction !== "dislike") {
    return NextResponse.json({ error: "La reacción no es válida." }, { status: 400 });
  }
  const nextReaction = requestedReaction as Reaction;

  // La RLS garantiza que un empleado solo pueda reaccionar a publicaciones que ve.
  const { data: visiblePost, error: postError } = await db
    .from("mural_posts")
    .select("id")
    .eq("id", postId)
    .maybeSingle();

  if (postError) {
    console.error("[api/mural/reactions] Error verificando publicación:", postError.message);
    return NextResponse.json({ error: "No se pudo verificar la publicación." }, { status: 500 });
  }
  if (!visiblePost) {
    return NextResponse.json({ error: "La publicación no existe o no está disponible para tu usuario." }, { status: 404 });
  }

  const { data: current, error: currentError } = await db
    .from("mural_post_reactions")
    .select("reaction")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (currentError) {
    console.error("[api/mural/reactions] Error consultando reacción:", currentError.message);
    return NextResponse.json({ error: "No se pudo consultar tu reacción." }, { status: 500 });
  }

  let savedReaction: Reaction = nextReaction;
  if (nextReaction === null || current?.reaction === nextReaction) {
    if (current) {
      const { error: deleteError } = await db
        .from("mural_post_reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
      if (deleteError) {
        console.error("[api/mural/reactions] Error quitando reacción:", deleteError.message);
        return NextResponse.json({ error: "No se pudo quitar tu reacción." }, { status: 500 });
      }
    }
    savedReaction = null;
  } else {
    const { error: upsertError } = await db
      .from("mural_post_reactions")
      .upsert(
        { post_id: postId, user_id: user.id, reaction: nextReaction, updated_at: new Date().toISOString() },
        { onConflict: "post_id,user_id" },
      );
    if (upsertError) {
      console.error("[api/mural/reactions] Error guardando reacción:", upsertError.message);
      return NextResponse.json({ error: "No se pudo guardar tu reacción." }, { status: 500 });
    }
  }

  const { data: counts, error: countsError } = await db.rpc("mural_post_reaction_counts", {
    post_ids: [postId],
  });
  if (countsError) {
    console.error("[api/mural/reactions] Error calculando contadores:", countsError.message);
    return NextResponse.json({ error: "No se pudieron actualizar los contadores." }, { status: 500 });
  }

  const row = (counts ?? [])[0] as { likes?: number; dislikes?: number } | undefined;
  return NextResponse.json({
    postId,
    reaction: savedReaction,
    likes: Number(row?.likes ?? 0),
    dislikes: Number(row?.dislikes ?? 0),
  }, { headers: { "Cache-Control": "no-store" } });
}
