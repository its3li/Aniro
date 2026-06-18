'use client';

import { useEffect } from 'react';
import { Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AppError]', error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground">
      <section className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary">
          !
        </div>
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The app hit an unexpected error. You can retry the current screen or go back home.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Retry
          </Button>
          <Button variant="outline" onClick={() => window.location.assign('/')} className="gap-2">
            <Home className="h-4 w-4" />
            Home
          </Button>
        </div>
      </section>
    </main>
  );
}
