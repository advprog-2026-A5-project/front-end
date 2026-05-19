import { AuthGuard } from "@/components/AuthGuard";

export default function NotFound() {
  return (
    <AuthGuard>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Page not found</h2>
        <p className="text-sm text-slate-600">The page you requested does not exist.</p>
      </div>
    </AuthGuard>
  );
}
