import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import RoleBadge from "../components/RoleBadge";

function Row({ label, children }) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900 sm:col-span-2">{children}</dd>
    </div>
  );
}

export default function ProfilePage() {
  const { user, tenant } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(tenant.companyCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked; the code is visible anyway
    }
  };

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">My profile</h1>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-slate-900">{user.name}</p>
            <div className="mt-1">
              <RoleBadge role={user.role} />
            </div>
          </div>
        </div>

        <dl className="mt-6 divide-y divide-slate-100 border-t border-slate-100">
          <Row label="Email">{user.email}</Row>
          <Row label="Company">{tenant?.companyName}</Row>
          <Row label="Company code">
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded-md bg-slate-100 px-2 py-1 text-sm">{tenant?.companyCode}</code>
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Your team enters this on the sign-in page, along with their email and password.
            </p>
          </Row>
          <Row label="Member since">{memberSince}</Row>
        </dl>
      </div>
    </div>
  );
}
