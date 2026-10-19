import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginRequest, LoginRequestSchema } from '@nsbe/shared';
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
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { signIn } from './api';

export function SignInPanel({ onSuccess }: { onSuccess: () => void }) {
  const form = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: { email: '', password: '' },
  });
  const login = useMutation({
    gcTime: 0,
    mutationFn: signIn,
    onSuccess: () => {
      form.reset();
      onSuccess();
    },
  });
  return (
    <Card className="mx-auto max-w-md bg-white">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back.</CardTitle>
        <CardDescription>
          Sign in with your chapter officer account to manage events.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-5"
          onSubmit={(e) => {
            void form.handleSubmit((input) => {
              login.mutate(input);
            })(e);
          }}
        >
          <div>
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="username"
              className="mt-2 h-11"
              {...form.register('email')}
              aria-invalid={!!form.formState.errors.email}
              aria-describedby="login-email-error"
            />
            <p id="login-email-error" className="text-destructive mt-1 text-sm">
              {form.formState.errors.email?.message}
            </p>
          </div>
          <div>
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className="mt-2 h-11"
              {...form.register('password')}
              aria-invalid={!!form.formState.errors.password}
              aria-describedby="login-password-error"
            />
            <p id="login-password-error" className="text-destructive mt-1 text-sm">
              {form.formState.errors.password?.message}
            </p>
          </div>
          {login.isError && (
            <p role="alert" className="text-destructive text-sm">
              {login.error.message}
            </p>
          )}
          <Button type="submit" disabled={login.isPending} className="h-11">
            {login.isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
