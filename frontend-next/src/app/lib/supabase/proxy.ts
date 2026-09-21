import { createServerClient } from "@supabase/ssr";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

export async function updateSession(
  request: NextRequest,
) {
  let supabaseResponse =
    NextResponse.next({
      request,
    });

  const supabase =
    createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(
            cookiesToSet,
            headers,
          ) {
            cookiesToSet.forEach(
              ({
                name,
                value,
              }) => {
                request.cookies.set(
                  name,
                  value,
                );
              },
            );

            supabaseResponse =
              NextResponse.next({
                request,
              });

            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                supabaseResponse.cookies.set(
                  name,
                  value,
                  options,
                );
              },
            );

            Object.entries(
              headers,
            ).forEach(
              ([key, value]) => {
                supabaseResponse.headers.set(
                  key,
                  value,
                );
              },
            );
          },
        },
      },
    );

  /*
   * Verificamos los claims de la sesión.
   *
   * No usamos getSession() aquí para decidir
   * si el usuario está autenticado.
   */
  const {
    data: claimsData,
  } = await supabase.auth.getClaims();

  const userClaims =
    claimsData?.claims;

  /*
   * Por ahora solo protegemos las rutas
   * de la aplicación.
   *
   * Login y rutas de auth quedan públicas.
   */
  const isPublicRoute =
    request.nextUrl.pathname.startsWith(
      "/login",
    ) ||
    request.nextUrl.pathname.startsWith(
      "/auth",
    );

  if (
    !userClaims &&
    !isPublicRoute
  ) {
    const url =
      request.nextUrl.clone();

    url.pathname = "/login";

    return NextResponse.redirect(
      url,
    );
  }

  /*
   * IMPORTANTE:
   * devolvemos la misma respuesta de Supabase
   * para conservar las cookies actualizadas.
   */
  return supabaseResponse;
}