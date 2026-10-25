import { statusLabel } from "../../lib/assets";

const STYLES = {
  operational: { pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  maintenance: { pill: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  decommissioned: { pill: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
};

export default function AssetStatusPill({ status }) {
  const s = STYLES[status] || STYLES.decommissioned;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${s.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {statusLabel(status)}
    </span>
  );
}
