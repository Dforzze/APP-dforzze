import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: "#8b5cf6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Dforzze — Gestión Inteligente de Ropa",
  description: "Plataforma para gestión de negocios de ropa. Inventario, ventas, pedidos, clientes y analytics.",
  keywords: ["ropa", "gestión", "inventario", "ventas", "pedidos", "analytics", "Dforzze"],
  authors: [{ name: "Dforzze" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/dforzze-logo-small.png",
    apple: "/dforzze-logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dforzze",
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
