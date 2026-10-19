import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateEvent, Event } from '@nsbe/shared';
import { Button } from '@nsbe/ui/components/button';
import { Input } from '@nsbe/ui/components/input';
import { Label } from '@nsbe/ui/components/label';
import { Textarea } from '@nsbe/ui/components/textarea';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { createEventFormSchema, eventDefaults, type EventFormSchema } from './form';

export function EventForm({
  event,
  pending,
  error,
  onSave,
  onCancel,
}: {
  event?: Event;
  pending: boolean;
  error?: string;
  onSave: (data: CreateEvent) => void;
  onCancel: () => void;
}) {
  const form = useForm<z.input<typeof EventFormSchema>, unknown, z.output<typeof EventFormSchema>>({
    resolver: zodResolver(createEventFormSchema(event)),
    defaultValues: eventDefaults(event),
  });
  const fields = form.formState.errors;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <form
      className="grid gap-5"
      onSubmit={(e) => {
        void form.handleSubmit(onSave)(e);
      }}
    >
      <fieldset disabled={pending} className="grid gap-5">
        <div>
          <Label htmlFor="event-title">Event title</Label>
          <Input
            id="event-title"
            autoFocus
            className="mt-2 h-11"
            {...form.register('title')}
            aria-invalid={!!fields.title}
            aria-describedby="event-title-error"
          />
          <p id="event-title-error" className="text-destructive mt-1 text-sm">
            {fields.title?.message}
          </p>
        </div>
        <div>
          <Label htmlFor="event-description">Description</Label>
          <Textarea
            id="event-description"
            className="mt-2 min-h-28"
            {...form.register('description')}
            aria-invalid={!!fields.description}
            aria-describedby="event-description-error"
          />
          <p id="event-description-error" className="text-destructive mt-1 text-sm">
            {fields.description?.message}
          </p>
        </div>
        <div>
          <Label htmlFor="event-location">Location</Label>
          <Input
            id="event-location"
            className="mt-2 h-11"
            {...form.register('location')}
            aria-invalid={!!fields.location}
            aria-describedby="event-location-error"
          />
          <p id="event-location-error" className="text-destructive mt-1 text-sm">
            {fields.location?.message}
          </p>
        </div>
        <p className="text-muted-foreground text-xs leading-5">
          Enter dates in your browser’s time zone: {timezone}. Visitors see Mountain Time.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="event-start">Starts</Label>
            <Input
              id="event-start"
              type="datetime-local"
              step="0.001"
              className="mt-2 h-11"
              {...form.register('startsAt')}
              aria-invalid={!!fields.startsAt}
              aria-describedby="event-start-error"
            />
            <p id="event-start-error" className="text-destructive mt-1 text-sm">
              {fields.startsAt?.message}
            </p>
          </div>
          <div>
            <Label htmlFor="event-end">Ends (optional)</Label>
            <Input
              id="event-end"
              type="datetime-local"
              step="0.001"
              className="mt-2 h-11"
              {...form.register('endsAt')}
              aria-invalid={!!fields.endsAt}
              aria-describedby="event-end-error"
            />
            <p id="event-end-error" className="text-destructive mt-1 text-sm">
              {fields.endsAt?.message}
            </p>
          </div>
        </div>
        <div>
          <Label htmlFor="event-rsvp">RSVP URL (optional)</Label>
          <Input
            id="event-rsvp"
            type="url"
            placeholder="https://"
            className="mt-2 h-11"
            {...form.register('rsvpLink')}
            aria-invalid={!!fields.rsvpLink}
            aria-describedby="event-rsvp-error"
          />
          <p id="event-rsvp-error" className="text-destructive mt-1 text-sm">
            {fields.rsvpLink?.message}
          </p>
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-3 border-t pt-5">
        <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : event ? 'Save changes' : 'Create event'}
        </Button>
      </div>
    </form>
  );
}
