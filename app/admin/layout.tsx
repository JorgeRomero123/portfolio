import { auth } from '@/lib/auth';
import AdminHeader from '@/components/admin/AdminHeader';

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
