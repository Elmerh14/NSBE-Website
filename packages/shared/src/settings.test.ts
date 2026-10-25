import { describe, expect, it } from 'vitest';

import { UpdateSiteSettingsRequestSchema } from './settings';

const EMPTY = {
  contactEmail: null,
  joinUrl: null,
  instagramUrl: null,
  linkedinUrl: null,
  tiktokUrl: null,
  facebookUrl: null,
};

function parse(overrides: Record<string, unknown>) {
  return UpdateSiteSettingsRequestSchema.safeParse({ ...EMPTY, ...overrides });
}

describe('UpdateSiteSettingsRequestSchema', () => {
  it('accepts every field cleared', () => {
    expect(parse({}).success).toBe(true);
  });

  it('turns blank and whitespace-only values into null', () => {
    const result = parse({ contactEmail: '', joinUrl: '   ' });
    expect(result.data).toMatchObject({ contactEmail: null, joinUrl: null });
  });

  it('trims values', () => {
    const result = parse({ contactEmail: '  nsbe@example.edu ' });
    expect(result.data?.contactEmail).toBe('nsbe@example.edu');
  });

  it('accepts a full set of valid values', () => {
    const result = parse({
      contactEmail: 'nsbe@example.edu',
      joinUrl: 'https://forms.gle/abc123',
      instagramUrl: 'https://www.instagram.com/nsbe',
      linkedinUrl: 'https://linkedin.com/company/nsbe',
      tiktokUrl: 'https://www.tiktok.com/@nsbe',
      facebookUrl: 'https://facebook.com/nsbe',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(parse({ contactEmail: 'not-an-email' }).success).toBe(false);
  });

  it('rejects links that are not https', () => {
    expect(parse({ joinUrl: 'http://forms.gle/abc' }).success).toBe(false);
    expect(parse({ joinUrl: 'javascript:alert(1)' }).success).toBe(false);
  });

  it('rejects a social link to the wrong site', () => {
    expect(parse({ instagramUrl: 'https://example.com/nsbe' }).success).toBe(false);
    expect(parse({ instagramUrl: 'https://instagram.com.evil.example/nsbe' }).success).toBe(false);
    expect(parse({ facebookUrl: 'https://www.instagram.com/nsbe' }).success).toBe(false);
  });

  it('names the platform in the error message', () => {
    const result = parse({ tiktokUrl: 'https://example.com' });
    expect(result.error?.issues[0]?.message).toBe(
      'Enter a TikTok link starting with https://tiktok.com/',
    );
  });

  it('rejects an overlong value', () => {
    expect(parse({ joinUrl: `https://example.com/${'a'.repeat(2048)}` }).success).toBe(false);
  });

  it('requires every key, because PUT replaces the whole row', () => {
    const missingOne: Partial<typeof EMPTY> = { ...EMPTY };
    delete missingOne.facebookUrl;
    expect(UpdateSiteSettingsRequestSchema.safeParse(missingOne).success).toBe(false);
  });

  it('rejects unknown fields', () => {
    expect(parse({ twitterUrl: 'https://x.com/nsbe' }).success).toBe(false);
  });
});
