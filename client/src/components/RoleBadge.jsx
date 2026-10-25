import { ROLE_LABELS, ROLES } from "../lib/roles";

const STYLES = {
  [ROLES.ADMIN]: "bg-violet-100 text-violet-700",
  [ROLES.MANAGER]: "bg-sky-100 text-sky-700",
  [ROLES.TECHNICIAN]: "bg-emerald-100 text-emerald-700",
};

export default function RoleBadge({ role }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        STYLES[role] || "bg-slate-100 text-slate-700"
      }`}
    >
      {ROLE_LABELS[role] || role}
    </span>
  );
}
