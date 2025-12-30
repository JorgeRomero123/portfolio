import LoginForm from '@/components/admin/LoginForm';

export const metadata = {
  title: 'Admin Login | Jorge Romero Romanis',
  description: 'Admin login page',
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
            <p className="text-gray-600">Sign in to manage your portfolio</p>
          </div>

          <LoginForm />
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Protected area - Authorized access only
        </p>
      </div>
    </div>
  );
}
