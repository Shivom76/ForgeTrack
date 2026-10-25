import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { ROLES, ROLE_LABELS } from "../lib/roles";

// Each card is one cheap API call (ask for 1 item, read `total`) and links to the
// matching filtered list on the Assets page.
// For technicians the server automatically limits every query to their own assets.
const getCards = (isTech) => [
  { key: "total", label: isTech ? "My assets" : "Total assets", query: "", to: "/assets" },
  { key: "maintenance", label: "Under maintenance", query: "&status=maintenance", to: "/assets?status=maintenance" },
  { key: "due", label: "Service due in 7 days", hint: "includes overdue", query: "&dueWithinDays=7", to: "/assets?due=7", warn: true },
  ...(isTech
    ? []
    : [{ key: "unassigned", label: "Unassigned", query: "&assignedTo=unassigned", to: "/assets?assignedTo=unassigned" }]),
];

function StatCard({ label, hint, value, loading, warn, to }) {
  const highlight = warn && typeof value === "number" && value > 0;
  return (
    <Link
      to={to}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      {loading ? (
        <div className="mt-3 h-9 w-16 animate-pulse rounded-md bg-slate-100" />
      ) : (
        <p className={`mt-2 text-3xl font-bold ${highlight ? "text-red-600" : "text-slate-900"}`}>{value ?? "—"}</p>
      )}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </Link>
  );
}

export default function HomePage() {
  const { user, tenant } = useAuth();
  const isTech = user.role === ROLES.TECHNICIAN;
  const cards = getCards(isTech);
  const [state, setState] = useState({ loading: true, error: "", counts: {} });

  useEffect(() => {
    const controller = new AbortController();
    const wanted = getCards(isTech);
    setState({ loading: true, error: "", counts: {} });

    Promise.all(wanted.map((c) => api(`/assets?limit=1${c.query}`, { signal: controller.signal })))
      .then((results) => {
        const counts = {};
        wanted.forEach((c, i) => {
          counts[c.key] = results[i].total;
        });
        setState({ loading: false, error: "", counts });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setState({ loading: false, error: err.message, counts: {} });
      });

    return () => controller.abort();
  }, [isTech]);

  const firstName = user.name.split(" ")[0];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Welcome back, {firstName}</h1>
      <p className="mt-1 text-slate-500">
        {tenant?.companyName} · {ROLE_LABELS[user.role]}
      </p>

      {state.error && (
        <div role="alert" className="mt-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Couldn’t load your numbers: {state.error}</span>
        </div>
      )}

      <section aria-label="Overview" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.key} label={c.label} hint={c.hint} warn={c.warn} to={c.to} loading={state.loading} value={state.counts[c.key]} />
        ))}
      </section>
    </div>
  );
}
