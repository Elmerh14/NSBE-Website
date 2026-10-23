import { zodResolver } from '@hookform/resolvers/zod';
import { LoginRequestSchema } from '@nsbe/shared';
import { Button } from '@nsbe/ui/components/button';
import { Input } from '@nsbe/ui/components/input';
import { Label } from '@nsbe/ui/components/label';
import { useForm } from 'react-hook-form';

import { isApiError } from '../../lib/api';
import { useLogin } from './useLogin';

export function LoginForm() {
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(LoginRequestSchema) });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) =>
        void handleSubmit((data) => {
          login.mutate(data);
        })(e)
      }
      noValidate
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="username" {...register('email')} />
        {errors.email?.message && (
          <p role="alert" className="text-destructive text-sm">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
        />
        {errors.password?.message && (
          <p role="alert" className="text-destructive text-sm">
            {errors.password.message}
          </p>
        )}
      </div>

      {login.error && (
        <p role="alert" className="text-destructive text-sm">
          {isApiError(login.error, 'INVALID_CREDENTIALS')
            ? 'Invalid email or password'
            : 'Something wrong has occurred try again'}
        </p>
      )}
      <Button type="submit" disabled={login.isPending && true}>
        Submit
      </Button>
    </form>
  );
}
