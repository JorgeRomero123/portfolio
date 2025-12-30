import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'Admin Dashboard | Jorge Romero Romanis',
  description: 'Admin dashboard',
};

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/admin/login');
  }

  const sections = [
    {
      title: '360° Photos',
      description: 'Upload and manage 360° panoramic photos',
      href: '/admin/photos360',
      icon: '🌐',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Photo Gallery',
      description: 'Manage regular photo gallery',
      href: '/admin/gallery',
      icon: '📸',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Videos',
      description: 'Manage YouTube videos',
      href: '/admin/videos',
      icon: '🎥',
      color: 'from-red-500 to-orange-500',
    },
    {
      title: '360° Tours',
      description: 'Manage virtual tours',
      href: '/admin/tours',
      icon: '🏘️',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session.user?.name || 'Admin'}!</p>
        </div>

        {/* Management Sections */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
            >
              <div className={`bg-gradient-to-br ${section.color} p-8 flex items-center justify-center`}>
                <span className="text-6xl">{section.icon}</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {section.title}
                </h3>
                <p className="text-gray-600 text-sm">{section.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Links</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/"
              className="text-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <p className="text-sm text-gray-600">View</p>
              <p className="text-lg font-semibold text-gray-900">Public Site</p>
            </Link>
            <Link
              href="/gallery360"
              className="text-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <p className="text-sm text-gray-600">View</p>
              <p className="text-lg font-semibold text-gray-900">360° Gallery</p>
            </Link>
            <Link
              href="/gallery"
              className="text-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <p className="text-sm text-gray-600">View</p>
              <p className="text-lg font-semibold text-gray-900">Photo Gallery</p>
            </Link>
            <Link
              href="/tools"
              className="text-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <p className="text-sm text-gray-600">View</p>
              <p className="text-lg font-semibold text-gray-900">Tools</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
