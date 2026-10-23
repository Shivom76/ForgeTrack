import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center">
      <div>
        <p className="text-5xl font-extrabold text-amber-500">404</p>
        <h1 className="mt-3 text-xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-1 text-sm text-slate-500">That page doesn’t exist or was moved.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
