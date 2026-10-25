import { Button } from '@nsbe/ui/components/button';
import { Link } from 'react-router';

import { SITE_NAME } from '../layout/site';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-16">
      <title>{`Page not found | ${SITE_NAME}`}</title>
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="text-muted-foreground">We couldn’t find the page you were looking for.</p>
      <Button variant="outline" asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  );
}
