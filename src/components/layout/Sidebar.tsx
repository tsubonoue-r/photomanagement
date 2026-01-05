'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FolderKanban,
  Image,
  Album,
  Settings,
  Home,
  Tags,
  Clipboard,
  Download,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: Home },
  { href: '/projects', label: 'プロジェクト', icon: FolderKanban },
  { href: '/photos', label: '写真', icon: Image },
  { href: '/albums', label: 'アルバム', icon: Album },
  { href: '/categories', label: '工種分類', icon: Tags },
  { href: '/blackboard', label: '電子黒板', icon: Clipboard },
  { href: '/export', label: 'エクスポート', icon: Download },
];

const bottomNavItems: NavItem[] = [
  { href: '/settings', label: '設定', icon: Settings },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active = isActive(item.href);

    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
        }`}
      >
        <Icon className={`h-5 w-5 ${active ? 'text-blue-600 dark:text-blue-400' : ''}`} />
        {item.label}
      </Link>
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 ${className}`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 dark:border-gray-800 px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Image className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            写真管理
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col h-[calc(100vh-4rem)] px-3 py-4">
        <div className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        {/* Bottom Navigation */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-1">
          {bottomNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </nav>
    </aside>
  );
}
