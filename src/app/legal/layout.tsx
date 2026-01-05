import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: {
    template: '%s | 工程写真管理システム',
    default: '法的情報',
  },
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <Link
            href="/"
            className="text-lg font-semibold text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300 transition-colors"
          >
            工程写真管理システム
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-4xl px-6 py-12">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
