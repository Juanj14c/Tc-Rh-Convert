
"use client";

import { useEffect } from "react";

export default function RefreshOnBackCache() {
  useEffect(() => {
    const handlePageHide = (event: PageTransitionEvent) => {
      // Si el navegador va a guardar esta página en BFCache,
      // ocultamos su contenido antes de abandonar el documento.
      if (event.persisted) {
        document.documentElement.style.visibility = "hidden";
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      // Si el navegador restaura una página guardada,
      // recargamos para volver a validar la sesión.
      if (event.persisted) {
        window.location.reload();
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  return null;
}
