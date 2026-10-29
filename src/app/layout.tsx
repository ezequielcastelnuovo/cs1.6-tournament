import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "UADE CS 1.6 1V1 TOURNAMENT // FaceIT LAN Edition",
  description: "Torneo 1v1 LAN Counter-Strike 1.6 — UADE Esports FaceIT Style",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-cs-dark text-white min-h-screen antialiased">
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
