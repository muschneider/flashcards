'use client';

import Link from 'next/link';
import { Sun, Moon, BookOpen, Home, Settings, SlidersHorizontal, RotateCcw, GraduationCap } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white"
          aria-label="FlashCards Home"
        >
          <GraduationCap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline">FlashCards</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink href="/" icon={<Home className="h-4 w-4" />} label="Home" />
          <NavLink href="/study" icon={<BookOpen className="h-4 w-4" />} label="Study" />
          <NavLink href="/manage" icon={<Settings className="h-4 w-4" />} label="Manage" />
          <NavLink href="/settings" icon={<SlidersHorizontal className="h-4 w-4" />} label="Settings" />
          <NavLink href="/reset" icon={<RotateCcw className="h-4 w-4" />} label="Reset" />

          <button
            onClick={toggleTheme}
            className="ml-2 rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
      aria-label={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
