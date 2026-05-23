import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { ClerkProvider } from "@clerk/nextjs";
import Footer from "../components/Footer";
import OnboardingGuard from "../components/OnboardingGuard";
import 'leaflet/dist/leaflet.css';

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ParkQuest - National Parks Tracker",
  description: "Track your visits, earn badges, and explore the beauty of national parks across the country with ParkQuest.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${archivo.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col`}
        >
          <OnboardingGuard />
          <div className="flex-1">
            {children}
          </div>

          {/* Footer */}
          <Footer />

          {/* Vercel Analytics */}
          <Analytics />

        </body>
      </html>
    </ClerkProvider>
  );
}
