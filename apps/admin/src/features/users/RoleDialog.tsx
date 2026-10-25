import { zodResolver } from '@hookform/resolvers/zod';
import { type Role, UpdateUserRequestSchema } from '@nsbe/shared';
import { Button } from '@nsbe/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@nsbe/ui/components/dialog';
import { Label } from '@nsbe/ui/components/label';
import { Controller, useForm } from 'react-hook-form';

import { RoleSelect } from './RoleSelect';
import { userErrorMessage } from './user-text';

type RoleDialogProps = {
  title: string;
  description: string;
  submitLabel: string;
  defaultRole: Role;
  isPending: boolean;
  error: unknown;
  onSubmit: (role: Role) => void;
  onClose: () => void;
};

// Picks a role, for "Change role" and "Reactivate". The caller owns the request.
export function RoleDialog({
  title,
  description,
  submitLabel,
  defaultRole,
  isPending,
  error,
  onSubmit,
  onClose,
}: RoleDialogProps) {
  // Reactivate's body has the same shape ({ role }), so one schema covers both.
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(UpdateUserRequestSchema),
    defaultValues: { role: defaultRole },
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isPending) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={(e) =>
            void handleSubmit(({ role }) => {
              onSubmit(role);
            })(e)
          }
          noValidate
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="role">Role</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <RoleSelect
                  id="role"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                />
              )}
            />
          </div>

          {error !== null && (
            <p role="alert" className="text-destructive text-sm">
              {userErrorMessage(error)}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
