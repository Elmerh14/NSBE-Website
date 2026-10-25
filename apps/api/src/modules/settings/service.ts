import type { SiteSettings, UpdateSiteSettingsRequest } from '@nsbe/shared';

import type { PrismaClient } from '../../generated/prisma/client';

// The table is a singleton: this is the only id it may hold (a CHECK constraint enforces it).
const SETTINGS_ID = 1;

const SETTINGS_SELECT = {
  contactEmail: true,
  joinUrl: true,
  instagramUrl: true,
  linkedinUrl: true,
  tiktokUrl: true,
  facebookUrl: true,
} as const;

// What the site shows before anyone has saved settings: nothing.
const EMPTY_SETTINGS: SiteSettings = {
  contactEmail: null,
  joinUrl: null,
  instagramUrl: null,
  linkedinUrl: null,
  tiktokUrl: null,
  facebookUrl: null,
};

// No row until the first save, so a fresh database needs no seeding.
export async function getSettings(client: PrismaClient): Promise<SiteSettings> {
  const row = await client.siteSettings.findUnique({
    where: { id: SETTINGS_ID },
    select: SETTINGS_SELECT,
  });
  return row ?? EMPTY_SETTINGS;
}

// Replaces every field. upsert creates the row on the first save.
export function updateSettings(
  client: PrismaClient,
  input: UpdateSiteSettingsRequest,
): Promise<SiteSettings> {
  return client.siteSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...input },
    update: input,
    select: SETTINGS_SELECT,
  });
}
