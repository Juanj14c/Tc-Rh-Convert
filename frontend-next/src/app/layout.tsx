import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/contexts/ThemeProvider";
import SileoProvider from "@/components/common/SileoProvider";

export const metadata: Metadata = {
  title: "Tc&Rh Convert",
  description:
    "Plataforma interna de Tc&Rh Convert",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider>
          <SileoProvider>
            {children}
          </SileoProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}