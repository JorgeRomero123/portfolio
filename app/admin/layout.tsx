import { auth } from '@/lib/auth';
import AdminHeader from '@/components/admin/AdminHeader';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="admin-layout">
      {session && <AdminHeader />}
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
}
