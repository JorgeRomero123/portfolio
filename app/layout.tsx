import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { headers } from 'next/headers';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jorge Romero Romanis - Portfolio",
  description: "Personal portfolio showcasing photography, videos, 360 tours, and interactive projects by Jorge Romero Romanis",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <html lang="en" className="bg-gray-50">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
      >
        {!isAdminRoute && <Navigation />}
        <main className={isAdminRoute ? '' : 'min-h-screen bg-gray-50'}>
          {children}
        </main>
        {!isAdminRoute && (
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
