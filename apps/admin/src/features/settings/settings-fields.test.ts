import { describe, expect, it } from 'vitest';

import { CONTACT_FIELDS, SOCIAL_FIELDS, toFormValues } from './settings-fields';

const UNSET = {
  contactEmail: null,
  joinUrl: null,
  instagramUrl: null,
  linkedinUrl: null,
  tiktokUrl: null,
  facebookUrl: null,
};

describe('toFormValues', () => {
  it('turns unset fields into empty strings', () => {
    expect(Object.values(toFormValues(UNSET))).toEqual(['', '', '', '', '', '']);
  });

  it('keeps saved values', () => {
    const values = toFormValues({ ...UNSET, instagramUrl: 'https://instagram.com/nsbe' });
    expect(values.instagramUrl).toBe('https://instagram.com/nsbe');
  });
});

describe('settings field lists', () => {
  it('show every setting exactly once', () => {
    const names = [...CONTACT_FIELDS, ...SOCIAL_FIELDS].map((field) => field.name).sort();
    expect(names).toEqual(Object.keys(UNSET).sort());
  });
});
