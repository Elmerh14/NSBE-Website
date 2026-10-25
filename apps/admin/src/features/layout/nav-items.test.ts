import { House, Users } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { isNavItemActive, type NavItem, userInitial, visibleNavItems } from './nav-items';

const ITEMS: NavItem[] = [
  { title: 'Home', to: '/', icon: House },
  { title: 'Users', to: '/users', icon: Users, roles: ['SUPER_ADMIN'] },
];

describe('visibleNavItems', () => {
  it('shows role-limited links to that role', () => {
    expect(visibleNavItems(ITEMS, 'SUPER_ADMIN').map((item) => item.title)).toEqual([
      'Home',
      'Users',
    ]);
  });

  it('hides role-limited links from other roles', () => {
    expect(visibleNavItems(ITEMS, 'USER').map((item) => item.title)).toEqual(['Home']);
  });
});

describe('isNavItemActive', () => {
  it('matches the dashboard only on /', () => {
    expect(isNavItemActive('/', '/')).toBe(true);
    expect(isNavItemActive('/users', '/')).toBe(false);
  });

  it('matches a page and its sub-pages', () => {
    expect(isNavItemActive('/users', '/users')).toBe(true);
    expect(isNavItemActive('/users/4', '/users')).toBe(true);
  });

  it('does not match a page that only shares a prefix', () => {
    expect(isNavItemActive('/users-archive', '/users')).toBe(false);
  });
});

describe('userInitial', () => {
  it('uses the first letter of the name, uppercased', () => {
    expect(userInitial('elmer')).toBe('E');
  });

  it('ignores leading spaces', () => {
    expect(userInitial('  Yahya')).toBe('Y');
  });

  it('keeps a character made of two code units whole', () => {
    expect(userInitial('😀 Smile')).toBe('😀');
  });

  it('falls back to ? for an empty name', () => {
    expect(userInitial('')).toBe('?');
  });
});
