import type { Role } from '@nsbe/shared';
import { LayoutDashboard, type LucideIcon } from 'lucide-react';

export type NavItem = {
  title: string;
  to: string;
  icon: LucideIcon;
  // Leave out to show the link to every role.
  roles?: readonly Role[];
};

// Every page in the sidebar. Add your page here when you add its route in router.tsx.
export const NAV_ITEMS: readonly NavItem[] = [
  { title: 'Dashboard', to: '/', icon: LayoutDashboard },
];

// Hiding a link is only for tidiness: the API enforces roles, so the page must check too.
export function visibleNavItems(items: readonly NavItem[], role: Role) {
  return items.filter((item) => !item.roles || item.roles.includes(role));
}

// '/' only matches itself; other links also match their sub-pages, e.g. /events/3 for /events.
export function isNavItemActive(pathname: string, to: string) {
  if (to === '/') return pathname === '/';
  return pathname === to || pathname.startsWith(`${to}/`);
}

// The letter shown in the avatar circle. Array.from keeps emoji and accented letters whole.
export function userInitial(name: string) {
  const first = Array.from(name.trim())[0];
  return first ? first.toUpperCase() : '?';
}
