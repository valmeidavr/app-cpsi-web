import type { Metadata } from "next";
import { Nunito, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/AuthProvider";

const fontSans = Nunito_Sans({ subsets: ["latin"], variable: "--font-sans" });
const fontTitle = Nunito({ subsets: ["latin"], variable: "--font-title" });

export const metadata: Metadata = {
  title: "PrevSaúde AAP-VR",
  description: "Software de Gestão AAP-VR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontTitle.variable,
          fontSans.variable
        )}
      >
        <AuthProvider>
          {children}
          <Toaster richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
