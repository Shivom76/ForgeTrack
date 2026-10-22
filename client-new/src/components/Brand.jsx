import { Link } from "react-router-dom";
import { Hammer } from "lucide-react";

export default function Brand({ to = "/", className = "" }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${className}`}
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500 text-slate-900 shadow-sm">
        <Hammer className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
      </span>
      <span className="text-xl font-extrabold tracking-tight text-slate-900">ForgeTrack</span>
    </Link>
  );
}
