import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@nsbe/ui/components/card';

// Where users with a temporary password (mustChangePassword) are sent. The form comes later.
export function ChangePasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Choose a new password</CardTitle>
          <CardDescription>You need to replace your temporary password first.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Change-password form coming soon.</p>
        </CardContent>
      </Card>
    </main>
  );
}
