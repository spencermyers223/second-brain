'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard', icon: '◫' },
  { href: '/board', label: 'Board', icon: '☰' },
  { href: '/items', label: 'Items', icon: '☷' },
  { href: '/items/new', label: 'Quick Add', icon: '+' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-zinc-800 bg-zinc-950 h-screen sticky top-0">
        <div className="p-5 border-b border-zinc-800">
          <h1 className="text-lg font-bold text-white tracking-tight">🧠 Second Brain</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === l.href
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <span className="text-base">{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 flex z-50">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex-1 flex flex-col items-center py-3 text-xs ${
              pathname === l.href ? 'text-white' : 'text-zinc-500'
            }`}
          >
            <span className="text-lg mb-0.5">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
