import { Button } from '@nsbe/ui/components/button';

import { SettingsForm } from './SettingsForm';
import { useSettings } from './useSettings';

export function SettingsPage() {
  const settings = useSettings();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Contact details and social links shown in the website footer.
        </p>
      </div>

      {settings.isPending && <p className="text-muted-foreground text-sm">Loading settings…</p>}

      {settings.isError && (
        <div className="flex items-center gap-4">
          <p role="alert" className="text-destructive text-sm">
            Couldn&apos;t load settings.
          </p>
          <Button variant="outline" size="sm" onClick={() => void settings.refetch()}>
            Try again
          </Button>
        </div>
      )}

      {/* Rendered only once loaded, so the form starts with the saved values. */}
      {settings.data && <SettingsForm settings={settings.data} />}
    </div>
  );
}
