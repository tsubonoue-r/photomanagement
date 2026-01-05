import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CameraPageClient } from './CameraPageClient';

export default async function CameraPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return <CameraPageClient />;
}
