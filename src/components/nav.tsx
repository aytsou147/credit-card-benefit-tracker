'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Clock, CreditCard, History, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (pathname === '/login') return null;

  const links = [
    { href: '/', label: 'Dashboard', icon: CreditCard },
    { href: '/due', label: 'Due', icon: Clock },
    { href: '/history', label: 'History', icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
        <Link href="/" className="mr-6 flex items-center gap-2 font-semibold">
          <CreditCard className="h-5 w-5" />
          <span className="hidden sm:inline">Benefit Tracker</span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Button
                variant={pathname === href ? 'secondary' : 'ghost'}
                size="sm"
                className={cn('gap-2', pathname === href && 'font-medium')}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Button>
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
