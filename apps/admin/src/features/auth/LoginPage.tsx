import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@nsbe/ui/components/card';

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>NSBE Admin</CardTitle>
          <CardDescription>Sign in to manage the chapter website.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Elmer: render your <LoginForm /> here (hand-written). */}
          <p className="text-muted-foreground text-sm">Login form coming soon.</p>
        </CardContent>
      </Card>
    </main>
  );
}
