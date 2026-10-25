import { zodResolver } from '@hookform/resolvers/zod';
import { CreateUserRequestSchema, type Role, type TemporaryPasswordResponse } from '@nsbe/shared';
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
import { Controller, useForm } from 'react-hook-form';

import { isApiError } from '../../lib/api';
import { RoleSelect } from './RoleSelect';
import { useCreateUser } from './useCreateUser';
import { userErrorMessage } from './user-text';

// Most new accounts are regular admins; super admin is a deliberate choice.
const DEFAULT_ROLE: Role = 'USER';

type AddUserDialogProps = {
  onClose: () => void;
  onCreated: (result: TemporaryPasswordResponse) => void;
};

export function AddUserDialog({ onClose, onCreated }: AddUserDialogProps) {
  const createUser = useCreateUser();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(CreateUserRequestSchema),
    defaultValues: { name: '', email: '', role: DEFAULT_ROLE },
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !createUser.isPending) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            They get a temporary password and must change it when they first log in.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={(e) =>
            void handleSubmit((body) => {
              createUser.mutate(body, {
                onSuccess: onCreated,
                onError: (error) => {
                  if (isApiError(error, 'EMAIL_TAKEN')) {
                    setError('email', { message: userErrorMessage(error) });
                  }
                },
              });
            })(e)
          }
          noValidate
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" autoComplete="off" {...register('name')} />
            {errors.name?.message && (
              <p role="alert" className="text-destructive text-sm">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="off" {...register('email')} />
            {errors.email?.message && (
              <p role="alert" className="text-destructive text-sm">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="role">Role</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <RoleSelect id="role" value={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          {createUser.error && !isApiError(createUser.error, 'EMAIL_TAKEN') && (
            <p role="alert" className="text-destructive text-sm">
              {userErrorMessage(createUser.error)}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createUser.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? 'Adding…' : 'Add user'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
