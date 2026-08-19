import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { Analytics } from "@vercel/analytics/next";
import { headers } from 'next/headers';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Jorge Romero Romanis - Full-Stack Software Engineer",
  description: "Full-stack software engineer (React, TypeScript, Next.js) who scaled PayPal's Fastlane to 1.5M users across 7 countries. Portfolio of shipped projects, plus photography, 360 tours, and interactive tools.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isAdminRoute = pathname.startsWith('/admin');
  // The homepage is a self-contained dark experience with its own nav/footer.
  const isHome = pathname === '/';
  const bareLayout = isAdminRoute || isHome;

  return (
    <html lang="en" className={isHome ? 'bg-[#f7f9fc]' : 'bg-gray-50'}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable} antialiased ${
          isHome ? 'bg-[#f7f9fc] text-[#0b1b3a]' : 'bg-gray-50 text-gray-900'
        }`}
      >
        {!bareLayout && <Navigation />}
        <main className={bareLayout ? '' : 'min-h-screen bg-gray-50'}>
          {children}
        </main>
        <Analytics />
        {!bareLayout && (
          <footer className="bg-gray-100 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <p className="text-center text-gray-600">
                © {new Date().getFullYear()} Jorge Romero Romanis. All rights reserved.
              </p>
            </div>
          </footer>
        )}
      </body>
    </html>
  );
}
