import { zodResolver } from '@hookform/resolvers/zod';
import { LoginRequestSchema } from '@nsbe/shared';
import { Button } from '@nsbe/ui/components/button';
import { Input } from '@nsbe/ui/components/input';
import { Label } from '@nsbe/ui/components/label';
import { useForm } from 'react-hook-form';

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(LoginRequestSchema) });

  return (
    <form
      onSubmit={(e) =>
        void handleSubmit((data) => {
          console.log(data);
        })(e)
      }
      noValidate
    >
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" autoComplete="username" {...register('email')} />
      {errors.email?.message && <p>{errors.email.message}</p>}
      <Label htmlFor="password">Password</Label>
      <Input
        id="password"
        type="password"
        autoComplete="current-password"
        {...register('password')}
      />
      {errors.password?.message && <p>{errors.password.message}</p>}
      <Button type="submit">Submit</Button>
    </form>
  );
}
