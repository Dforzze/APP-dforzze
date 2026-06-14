import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dforzze — Gestión Inteligente de Ropa",
  description: "Plataforma para gestión de negocios de ropa. Inventario, ventas, pedidos, clientes y analytics.",
  keywords: ["ropa", "gestión", "inventario", "ventas", "pedidos", "analytics", "Dforzze"],
  authors: [{ name: "Dforzze" }],
  icons: {
    icon: "/dforzze-logo-small.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
