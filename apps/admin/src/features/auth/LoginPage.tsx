import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@nsbe/ui/components/card';

import { LoginForm } from './LoginForm';

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>NSBE Admin</CardTitle>
          <CardDescription>Sign in to manage the chapter website.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
