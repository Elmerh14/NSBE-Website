import type { SiteSettings } from '@nsbe/shared';

import type { SocialPlatform } from './SocialIcon';

export const SITE_NAME = 'UC Denver NSBE';

// TODO: replace with the chapter's real one-line mission.
export const SITE_MISSION =
  'Placeholder mission statement. Replace with the chapter’s one-line mission.';

export type SitePage = { path: string; title: string };

// Every public page. The router makes a route for each one, and pages that aren't built yet
// show "Coming soon". To build one, give it a real component in router.tsx.
export const PAGES = {
  home: { path: '/', title: 'Home' },
  about: { path: '/about', title: 'About us' },
  leadership: { path: '/leadership', title: 'Leadership' },
  programs: { path: '/programs', title: 'Programs' },
  events: { path: '/events', title: 'Events' },
  gallery: { path: '/gallery', title: 'Gallery' },
  sponsors: { path: '/sponsors', title: 'Sponsors' },
  contact: { path: '/contact', title: 'Contact' },
} as const satisfies Record<string, SitePage>;

export type NavEntry =
  { kind: 'link'; page: SitePage } | { kind: 'group'; title: string; pages: readonly SitePage[] };

// The header: About opens a menu; the rest are plain links. The Join button is separate.
export const HEADER_NAV: readonly NavEntry[] = [
  { kind: 'group', title: 'About', pages: [PAGES.about, PAGES.leadership, PAGES.programs] },
  { kind: 'link', page: PAGES.events },
  { kind: 'link', page: PAGES.gallery },
  { kind: 'link', page: PAGES.sponsors },
  { kind: 'link', page: PAGES.contact },
];

// The footer's "Explore" column.
export const FOOTER_LINKS: readonly SitePage[] = [
  PAGES.about,
  PAGES.leadership,
  PAGES.programs,
  PAGES.events,
  PAGES.gallery,
  PAGES.sponsors,
  PAGES.contact,
];

export type SocialLink = { platform: SocialPlatform; label: string; url: string };

const SOCIALS: readonly { platform: SocialPlatform; label: string; key: keyof SiteSettings }[] = [
  { platform: 'instagram', label: 'Instagram', key: 'instagramUrl' },
  { platform: 'linkedin', label: 'LinkedIn', key: 'linkedinUrl' },
  { platform: 'tiktok', label: 'TikTok', key: 'tiktokUrl' },
  { platform: 'facebook', label: 'Facebook', key: 'facebookUrl' },
];

// The social links that are set, in a fixed order. Unset ones are left out of the footer.
export function socialLinks(settings: SiteSettings): SocialLink[] {
  return SOCIALS.flatMap(({ platform, label, key }) => {
    const url = settings[key];
    return url ? [{ platform, label, url }] : [];
  });
}
