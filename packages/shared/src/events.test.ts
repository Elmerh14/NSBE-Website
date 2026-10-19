import { describe, expect, it } from 'vitest';

import {
  CreateEventSchema,
  EventParamsSchema,
  EventsQuerySchema,
  EventsResponseSchema,
  UpdateEventSchema,
} from './events';

const event = {
  title: ' Chapter meeting ',
  description: 'Meet the chapter.',
  startsAt: '2026-11-01T18:00:00-07:00',
  location: 'Campus',
};

describe('event contracts', () => {
  it('accepts creation without optional fields and trims text', () => {
    expect(CreateEventSchema.parse(event).title).toBe('Chapter meeting');
  });

  it('rejects blank required text and unknown fields', () => {
    expect(CreateEventSchema.safeParse({ ...event, title: ' ' }).success).toBe(false);
    expect(CreateEventSchema.safeParse({ ...event, id: 1 }).success).toBe(false);
  });

  it('requires timezone information', () => {
    expect(CreateEventSchema.safeParse({ ...event, startsAt: '2026-11-01T18:00:00' }).success).toBe(
      false,
    );
  });

  it('compares actual instants across timezone offsets', () => {
    expect(CreateEventSchema.safeParse({ ...event, endsAt: '2026-11-02T00:00:00Z' }).success).toBe(
      false,
    );
    expect(CreateEventSchema.safeParse({ ...event, endsAt: '2026-11-02T02:00:00Z' }).success).toBe(
      true,
    );
  });

  it('allows only HTTP or HTTPS RSVP URLs', () => {
    expect(CreateEventSchema.safeParse({ ...event, rsvpLink: 'https://example.com' }).success).toBe(
      true,
    );
    expect(CreateEventSchema.safeParse({ ...event, rsvpLink: 'javascript:alert(1)' }).success).toBe(
      false,
    );
  });

  it('supports partial updates and clearing optional values, but rejects empty updates', () => {
    expect(UpdateEventSchema.parse({ endsAt: null, rsvpLink: null })).toEqual({
      endsAt: null,
      rsvpLink: null,
    });
    expect(UpdateEventSchema.safeParse({}).success).toBe(false);
    expect(UpdateEventSchema.safeParse({ location: 'Library' }).success).toBe(true);
  });

  it('parses positive integer route IDs and rejects malformed IDs', () => {
    expect(EventParamsSchema.parse({ id: '12' })).toEqual({ id: 12 });
    for (const id of ['0', '-1', '1.5', '1e2', 'abc', '9007199254740992']) {
      expect(EventParamsSchema.safeParse({ id }).success).toBe(false);
    }
  });

  it('accepts only the agreed event filters', () => {
    expect(EventsQuerySchema.safeParse({ period: 'upcoming' }).success).toBe(true);
    expect(EventsQuerySchema.safeParse({}).success).toBe(true);
    expect(EventsQuerySchema.safeParse({ period: 'future' }).success).toBe(false);
  });

  it('requires response IDs and explicit nullable fields', () => {
    expect(EventsResponseSchema.safeParse([event]).success).toBe(false);
    expect(
      EventsResponseSchema.safeParse([{ ...event, id: 1, endsAt: null, rsvpLink: null }]).success,
    ).toBe(true);
  });
});
