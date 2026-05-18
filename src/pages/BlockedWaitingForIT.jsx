import { Link } from "react-router-dom";

export default function BlockedWaitingForIT() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6">
        <h1 className="text-2xl font-semibold">Account pending</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your profile is blocked until IT completes the required setup.
          You can try signing in again after you receive access.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            replace
          >
            Go to login
          </Link>
        </div>
      </div>
    </div>
  );
}

