import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StatusProvider } from "@/contexts/statusContext";
import { SvgParticles } from "@/components/svgParticles";
import RainAlert from "@/components/rainAlert";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CoreDash",
  description: "A minimalist, self-hosted command center(Dashboard) designed for CasaOS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StatusProvider>
          {children}
          <SvgParticles />
          <RainAlert />
        </StatusProvider>
      </body>
    </html>
  );
}
