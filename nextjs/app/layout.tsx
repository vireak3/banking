import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";

import { ToastProvider } from "@/components/ToastProvider";
import { AuthProvider } from "@/store/useAuthStore";
import "@/styles/globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "BlueLedger Bank",
  description: "Modern digital banking frontend connected to the Laravel gateway.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${plexMono.variable} h-full bg-[var(--color-surface)] antialiased`}
    >
      <body className="min-h-full bg-[var(--app-background)] text-[var(--color-text)]">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
