import type { Event } from '@nsbe/shared';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { EventCard } from './EventCard';

const event: Event = {
  id: 1,
  title: 'Chapter meeting',
  description: 'Meet the chapter',
  startsAt: '2026-11-02T01:00:00Z',
  endsAt: null,
  location: 'Campus',
  rsvpLink: 'https://example.com/rsvp',
};

describe('event card', () => {
  it('shows the Mountain date rather than the UTC date and retains machine-readable time', () => {
    const html = renderToStaticMarkup(<EventCard event={event} past={false} />);
    expect(html).toContain('November 1, 2026');
    expect(html).toContain('Mountain Time');
    expect(html).toContain('dateTime="2026-11-02T01:00:00Z"');
    expect(html).toContain('Chapter meeting');
    expect(html).toContain('Campus');
  });

  it('provides a safe external RSVP for upcoming events', () => {
    const html = renderToStaticMarkup(<EventCard event={event} past={false} />);
    expect(html).toContain('href="https://example.com/rsvp"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('opens a new tab');
  });

  it('does not invite RSVP for past events or events with no link', () => {
    expect(renderToStaticMarkup(<EventCard event={event} past />)).not.toContain(
      'href="https://example.com/rsvp"',
    );
    expect(
      renderToStaticMarkup(<EventCard event={{ ...event, rsvpLink: null }} past={false} />),
    ).not.toContain('RSVP');
  });
});
