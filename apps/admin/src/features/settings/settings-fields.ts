import type { SiteSettings } from '@nsbe/shared';

export type SettingsField = {
  name: keyof SiteSettings;
  label: string;
  type: 'email' | 'url';
  placeholder: string;
};

export const CONTACT_FIELDS: readonly SettingsField[] = [
  {
    name: 'contactEmail',
    label: 'Contact email',
    type: 'email',
    placeholder: 'nsbe@yourschool.edu',
  },
  {
    name: 'joinUrl',
    label: 'Join link',
    type: 'url',
    placeholder: 'https://forms.gle/…',
  },
];

export const SOCIAL_FIELDS: readonly SettingsField[] = [
  {
    name: 'instagramUrl',
    label: 'Instagram',
    type: 'url',
    placeholder: 'https://instagram.com/yourchapter',
  },
  {
    name: 'linkedinUrl',
    label: 'LinkedIn',
    type: 'url',
    placeholder: 'https://linkedin.com/company/yourchapter',
  },
  {
    name: 'tiktokUrl',
    label: 'TikTok',
    type: 'url',
    placeholder: 'https://tiktok.com/@yourchapter',
  },
  {
    name: 'facebookUrl',
    label: 'Facebook',
    type: 'url',
    placeholder: 'https://facebook.com/yourchapter',
  },
];

// Inputs hold strings, so a field that isn't set (null) starts as an empty box.
// On save the schema turns empty boxes back into null.
export function toFormValues(settings: SiteSettings): Record<keyof SiteSettings, string> {
  return {
    contactEmail: settings.contactEmail ?? '',
    joinUrl: settings.joinUrl ?? '',
    instagramUrl: settings.instagramUrl ?? '',
    linkedinUrl: settings.linkedinUrl ?? '',
    tiktokUrl: settings.tiktokUrl ?? '',
    facebookUrl: settings.facebookUrl ?? '',
  };
}
