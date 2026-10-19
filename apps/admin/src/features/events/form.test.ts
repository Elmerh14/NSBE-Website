import type { Event } from '@nsbe/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createEventFormSchema, eventDefaults, EventFormSchema, toLocalInput } from './form';

const input = {
  title: ' Meeting ',
  description: 'Chapter meeting',
  location: ' Campus ',
  startsAt: '2026-10-25T18:00',
  endsAt: '',
  rsvpLink: '',
};

describe('event editor dates and contract', () => {
  beforeEach(() => {
    vi.stubEnv('TZ', 'America/Denver');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('converts local Mountain time to ISO and clears empty optional fields', () => {
    expect(EventFormSchema.parse(input)).toEqual({
      title: 'Meeting',
      description: 'Chapter meeting',
      location: 'Campus',
      startsAt: '2026-10-26T00:00:00.000Z',
      endsAt: null,
      rsvpLink: null,
    });
  });

  it('preserves precision when converting saved dates into editor values', () => {
    expect(toLocalInput('2026-10-26T00:00:14.125Z')).toBe('2026-10-25T18:00:14.125');
  });

  it.each(['2026-03-08T02:30', '2026-02-30T12:00', 'bad-date', ''])(
    'rejects impossible or missing local time: %s',
    (startsAt) => {
      expect(EventFormSchema.safeParse({ ...input, startsAt }).success).toBe(false);
    },
  );

  it('rejects end-before-start and unsafe RSVP URLs', () => {
    expect(EventFormSchema.safeParse({ ...input, endsAt: '2026-10-25T17:00' }).success).toBe(false);
    expect(EventFormSchema.safeParse({ ...input, rsvpLink: 'javascript:alert(1)' }).success).toBe(
      false,
    );
    expect(EventFormSchema.safeParse({ ...input, title: ' ' }).success).toBe(false);
  });

  it('roundtrips existing events without moving the repeated fall DST hour', () => {
    const event: Event = {
      id: 1,
      title: 'Meeting',
      description: 'Chapter meeting',
      location: 'Campus',
      startsAt: '2026-11-01T08:30:00.000Z',
      endsAt: '2026-11-01T09:30:00.000Z',
      rsvpLink: 'https://example.com',
    };
    expect(createEventFormSchema(event).parse(eventDefaults(event))).toEqual({
      title: event.title,
      description: event.description,
      location: event.location,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      rsvpLink: event.rsvpLink,
    });
  });
});
