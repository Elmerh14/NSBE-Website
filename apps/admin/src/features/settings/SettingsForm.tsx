import { zodResolver } from '@hookform/resolvers/zod';
import { type SiteSettings, UpdateSiteSettingsRequestSchema } from '@nsbe/shared';
import { Button } from '@nsbe/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@nsbe/ui/components/card';
import { Input } from '@nsbe/ui/components/input';
import { Label } from '@nsbe/ui/components/label';
import { useForm } from 'react-hook-form';

import { CONTACT_FIELDS, type SettingsField, SOCIAL_FIELDS, toFormValues } from './settings-fields';
import { useUpdateSettings } from './useUpdateSettings';

type SettingsFormProps = {
  settings: SiteSettings;
};

export function SettingsForm({ settings }: SettingsFormProps) {
  const updateSettings = useUpdateSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(UpdateSiteSettingsRequestSchema),
    defaultValues: toFormValues(settings),
  });

  function renderField({ name, label, type, placeholder }: SettingsField) {
    const message = errors[name]?.message;
    return (
      <div key={name} className="flex flex-col gap-2">
        <Label htmlFor={name}>{label}</Label>
        <Input
          id={name}
          type={type}
          placeholder={placeholder}
          autoComplete="off"
          aria-invalid={message ? true : undefined}
          {...register(name)}
        />
        {message && (
          <p role="alert" className="text-destructive text-sm">
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) =>
        void handleSubmit((body) => {
          updateSettings.mutate(body, {
            // Start "unsaved changes" tracking again from what was actually saved.
            onSuccess: ({ settings: saved }) => {
              reset(toFormValues(saved));
            },
          });
        })(e)
      }
      noValidate
    >
      {/* Side by side on wide screens, stacked on narrow ones. items-start keeps each card its own height. */}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle id="contact-heading">Contact</CardTitle>
            <CardDescription>How people reach the chapter and sign up.</CardDescription>
          </CardHeader>
          <CardContent>
            <fieldset aria-labelledby="contact-heading" className="flex flex-col gap-4">
              {CONTACT_FIELDS.map(renderField)}
            </fieldset>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle id="social-heading">Social links</CardTitle>
            <CardDescription>Each link must go to that platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <fieldset aria-labelledby="social-heading" className="flex flex-col gap-4">
              {SOCIAL_FIELDS.map(renderField)}
            </fieldset>
          </CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground text-sm">
        Leave a field empty to hide it from the website footer.
      </p>

      <div className="flex items-center justify-end gap-4">
        {updateSettings.isError && (
          <p role="alert" className="text-destructive text-sm">
            Couldn&apos;t save. Please try again.
          </p>
        )}
        {!updateSettings.isError && isDirty && (
          <p className="text-muted-foreground text-sm">Unsaved changes</p>
        )}
        {!updateSettings.isError && !isDirty && updateSettings.isSuccess && (
          <p role="status" className="text-muted-foreground text-sm">
            Saved
          </p>
        )}
        <Button type="submit" disabled={updateSettings.isPending}>
          {updateSettings.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
