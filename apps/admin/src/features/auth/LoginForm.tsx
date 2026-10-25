import { zodResolver } from '@hookform/resolvers/zod';
import { LoginRequestSchema } from '@nsbe/shared';
import { Button } from '@nsbe/ui/components/button';
import { Input } from '@nsbe/ui/components/input';
import { Label } from '@nsbe/ui/components/label';
import { Eye, EyeOff, TriangleAlert } from 'lucide-react';
import { type KeyboardEvent, useState } from 'react';
import { useForm } from 'react-hook-form';

import { isApiError } from '../../lib/api';
import { useLogin } from './useLogin';

export function LoginForm() {
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(LoginRequestSchema) });

  const passwordField = register('password');

  function checkCapsLock(e: KeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(e.getModifierState('CapsLock'));
  }

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
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className="pr-10"
            aria-describedby={capsLockOn ? 'caps-lock-warning' : undefined}
            {...passwordField}
            onKeyDown={checkCapsLock}
            onKeyUp={checkCapsLock}
            onBlur={(e) => {
              setCapsLockOn(false);
              void passwordField.onBlur(e);
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-controls="password"
            onClick={() => {
              setShowPassword((shown) => !shown);
            }}
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </Button>
        </div>
        {capsLockOn && (
          <p id="caps-lock-warning" role="status" className="flex items-center gap-1.5 text-sm">
            <TriangleAlert className="size-4 shrink-0" />
            Caps Lock is on
          </p>
        )}
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
