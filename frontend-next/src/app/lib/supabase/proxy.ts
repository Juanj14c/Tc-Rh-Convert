import {
  NextResponse,
  type NextRequest,
} from "next/server";

import {
  createServerClient,
} from "@supabase/ssr";

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

            if (headers) {
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
            }
          },
        },
      },
    );

  /*
   * =========================================
   * VERIFICAR SESIÓN
   * =========================================
   */

  const {
    data: claimsData,
  } =
    await supabase.auth.getClaims();

  const userClaims =
    claimsData?.claims;

  const pathname =
    request.nextUrl.pathname;

  /*
   * =========================================
   * RUTAS PÚBLICAS
   * =========================================
   */

  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith(
      "/forgot-password",
    ) ||
    pathname.startsWith(
      "/reset-password",
    ) ||
    pathname.startsWith("/auth");

  /*
   * =========================================
   * SIN SESIÓN
   * =========================================
   */

  if (
    !userClaims &&
    !isPublicRoute
  ) {
    const url =
      request.nextUrl.clone();

    url.pathname = "/login";
    url.search = "";

    return NextResponse.redirect(
      url,
    );
  }

  /*
   * =========================================
   * RUTAS EXCLUSIVAS DE ADMIN
   * =========================================
   */

  const adminOnlyRoutes = [
    "/employees",
    "/reports",
    "/evaluations",
    "/quick-tips",
  ];

  const isAdminOnlyRoute =
    adminOnlyRoutes.some(
      (route) =>
        pathname === route ||
        pathname.startsWith(
          `${route}/`,
        ),
    );

  /*
   * Si la ruta es administrativa,
   * necesitamos comprobar el rol real
   * del usuario en profiles.
   */

  if (
    userClaims &&
    isAdminOnlyRoute
  ) {
    const userId =
      userClaims.sub;

    if (!userId) {
      const url =
        request.nextUrl.clone();

      url.pathname = "/mural";
      url.search = "";

      return NextResponse.redirect(
        url,
      );
    }

    const {
      data: profile,
      error: profileError,
    } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

    /*
     * Ante cualquier problema leyendo
     * el perfil, no damos acceso administrativo.
     */

    if (
      profileError ||
      profile?.role !== "admin"
    ) {
      const url =
        request.nextUrl.clone();

      url.pathname = "/mural";
      url.search = "";

      return NextResponse.redirect(
        url,
      );
    }
  }

  /*
   * =========================================
   * RESPUESTA
   * =========================================
   */

  return supabaseResponse;
}