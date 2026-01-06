import { Suspense } from 'react';
import RegisterForm from '@/components/auth/RegisterForm';

function RegisterPageContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-8">
      <RegisterForm />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}
