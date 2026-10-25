import { describe, expect, it } from 'vitest';

import { FOOTER_LINKS, HEADER_NAV, PAGES, socialLinks } from './site';

const UNSET = {
  contactEmail: null,
  joinUrl: null,
  instagramUrl: null,
  linkedinUrl: null,
  tiktokUrl: null,
  facebookUrl: null,
};

const PATHS = new Set(Object.values(PAGES).map((page) => page.path));

describe('navigation', () => {
  it('only links to pages that have a route', () => {
    const headerPaths = HEADER_NAV.flatMap((entry) =>
      entry.kind === 'link' ? [entry.page.path] : entry.pages.map((page) => page.path),
    );
    for (const path of [...headerPaths, ...FOOTER_LINKS.map((page) => page.path)]) {
      expect(PATHS).toContain(path);
    }
  });

  it('reaches every page except home from the header', () => {
    const headerPaths = HEADER_NAV.flatMap((entry) =>
      entry.kind === 'link' ? [entry.page.path] : entry.pages.map((page) => page.path),
    );
    expect(new Set(headerPaths)).toEqual(new Set([...PATHS].filter((path) => path !== '/')));
  });
});

describe('socialLinks', () => {
  it('returns nothing when no social link is set', () => {
    expect(socialLinks(UNSET)).toEqual([]);
  });

  it('returns only the links that are set, in a fixed order', () => {
    const links = socialLinks({
      ...UNSET,
      facebookUrl: 'https://facebook.com/nsbe',
      instagramUrl: 'https://instagram.com/nsbe',
    });
    expect(links.map((link) => link.platform)).toEqual(['instagram', 'facebook']);
    expect(links[0]).toEqual({
      platform: 'instagram',
      label: 'Instagram',
      url: 'https://instagram.com/nsbe',
    });
  });

  it('ignores the contact email and join link', () => {
    expect(
      socialLinks({ ...UNSET, contactEmail: 'a@b.co', joinUrl: 'https://forms.gle/x' }),
    ).toEqual([]);
  });
});
