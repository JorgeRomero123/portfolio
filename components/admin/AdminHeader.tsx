'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

export default function AdminHeader() {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/admin/login' });
  };

  return (
    <header className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/admin" className="text-xl font-bold">
              Admin Panel
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Link
                href="/admin"
                className={`px-3 py-2 rounded ${
                  pathname === '/admin'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/photos360"
                className={`px-3 py-2 rounded ${
                  pathname?.startsWith('/admin/photos360')
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                360° Photos
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-gray-300 hover:text-white text-sm"
              target="_blank"
            >
              View Site →
            </Link>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-semibold text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
