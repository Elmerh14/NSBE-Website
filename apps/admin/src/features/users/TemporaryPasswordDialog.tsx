import type { TemporaryPasswordResponse } from '@nsbe/shared';
import { Button } from '@nsbe/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@nsbe/ui/components/dialog';
import { Input } from '@nsbe/ui/components/input';
import { Label } from '@nsbe/ui/components/label';
import { Check, Copy, TriangleAlert } from 'lucide-react';
import { useState } from 'react';

type TemporaryPasswordDialogProps = {
  result: TemporaryPasswordResponse;
  onDone: () => void;
};

// The API sends a temporary password only once, so this stays open until Done is clicked:
// no close button, and clicking outside or pressing Escape does nothing.
export function TemporaryPasswordDialog({ result, onDone }: TemporaryPasswordDialogProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function copy() {
    try {
      await navigator.clipboard.writeText(result.temporaryPassword);
      setCopyState('copied');
    } catch {
      // Clipboard access can be blocked; the password can still be selected and copied by hand.
      setCopyState('failed');
    }
  }

  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Temporary password for {result.user.name}</DialogTitle>
          <DialogDescription>
            They log in with this, then must choose their own password.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="temporaryPassword">Temporary password</Label>
          <div className="flex gap-2">
            <Input
              id="temporaryPassword"
              readOnly
              value={result.temporaryPassword}
              className="font-mono"
              onFocus={(e) => {
                e.currentTarget.select();
              }}
            />
            <Button type="button" variant="outline" onClick={() => void copy()}>
              {copyState === 'copied' ? <Check /> : <Copy />}
              {copyState === 'copied' ? 'Copied' : 'Copy'}
            </Button>
          </div>
          {copyState === 'failed' && (
            <p role="alert" className="text-destructive text-sm">
              Couldn&apos;t copy. Select the password and copy it yourself.
            </p>
          )}
        </div>

        <p className="flex gap-2 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            This is shown only once. Send it to {result.user.name} privately ({result.user.email}).
          </span>
        </p>

        <DialogFooter>
          <Button type="button" onClick={onDone}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
