import { zodResolver } from '@hookform/resolvers/zod';
import { ChangePasswordFormSchema } from '@nsbe/shared';
import { Button } from '@nsbe/ui/components/button';
import { Input } from '@nsbe/ui/components/input';
import { Label } from '@nsbe/ui/components/label';
import { useForm } from 'react-hook-form';

import { isApiError } from '../../lib/api';
import { useChangePassword } from './useChangePassword';

export function ChangePasswordForm() {
  const changePassword = useChangePassword();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(ChangePasswordFormSchema) });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) =>
        void handleSubmit(({ currentPassword, newPassword }) => {
          // confirmPassword is only checked here in the browser; the API doesn't take it.
          changePassword.mutate(
            { currentPassword, newPassword },
            {
              onError: (error) => {
                if (isApiError(error, 'INVALID_CURRENT_PASSWORD')) {
                  setError('currentPassword', { message: 'Your current password is incorrect' });
                }
              },
            },
          );
        })(e)
      }
      noValidate
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          {...register('currentPassword')}
        />
        {errors.currentPassword?.message && (
          <p role="alert" className="text-destructive text-sm">
            {errors.currentPassword.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          {...register('newPassword')}
        />
        {errors.newPassword?.message ? (
          <p role="alert" className="text-destructive text-sm">
            {errors.newPassword.message}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">At least 12 characters.</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword?.message && (
          <p role="alert" className="text-destructive text-sm">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {changePassword.error && !isApiError(changePassword.error, 'INVALID_CURRENT_PASSWORD') && (
        <p role="alert" className="text-destructive text-sm">
          Something went wrong. Please try again.
        </p>
      )}

      <Button type="submit" disabled={changePassword.isPending}>
        {changePassword.isPending ? 'Saving…' : 'Change password'}
      </Button>
    </form>
  );
}
