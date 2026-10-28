import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Plus, Search, Users,Trash } from "lucide-react";
import { api } from "../lib/api";
import { ROLES } from "../lib/roles";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import RoleBadge from "../components/RoleBadge";
import Field from "../components/Field";
import Button from "../components/Button";

const emptyForm = { name: "", email: "", password: "", role: ROLES.TECHNICIAN };

const ROLE_OPTIONS = [
  { value: ROLES.TECHNICIAN, title: "Field technician", desc: "Sees only the assets assigned to them." },
  { value: ROLES.MANAGER, title: "Operations manager", desc: "Sees the whole fleet, assigns and schedules work." },
  { value: ROLES.ADMIN, title: "Admin", desc: "Everything, plus managing users." },
];

const FILTERS = [
  { key: "all", label: "All" },
  { key: ROLES.ADMIN, label: "Admins" },
  { key: ROLES.MANAGER, label: "Managers" },
  { key: ROLES.TECHNICIAN, label: "Technicians" },
];

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "—";

function StatusPill({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function AddUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Escape closes the dialog
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await api("/users", {
        method: "POST",
        body: { ...form, name: form.name.trim(), email: form.email.trim() },
      });
      onCreated(res.user);
    } catch (err) {
      setError(err.message); // e.g. "email already exists"
      setSubmitting(false);
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="add-user-title" className="text-lg font-semibold text-slate-900">
          Add a team member
        </h2>
        <p className="mt-1 text-sm text-slate-500">They sign in with your company code, their email and this password.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <Field label="Full name" id="name" name="name" value={form.name} onChange={handleChange} required autoFocus />
          <Field label="Email" id="email" name="email" type="email" value={form.email} onChange={handleChange} required />

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Temporary password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                minLength={8}
                required
                className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-10 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">At least 8 characters. Share it with them privately.</p>
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-slate-700">Role</legend>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50 has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-amber-500"
                >
                  <input
                    type="radio"
                    name="role"
                    value={o.value}
                    checked={form.role === o.value}
                    onChange={handleChange}
                    className="mt-1 accent-amber-500"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-900">{o.title}</span>
                    <span className="block text-xs text-slate-500">{o.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <Button type="submit" loading={submitting}>
              {submitting ? "Adding…" : "Add user"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const loadUsers = useCallback(async () => {
    try {
      const res = await api("/users?limit=100");
      setUsers(res.data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Success message disappears by itself
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const handleCreated = (newUser) => {
    setIsModalOpen(false);
    setNotice(`${newUser.name} was added to your team.`);
    loadUsers();
  };

  const counts = useMemo(() => {
    const c = { all: users.length };
    users.forEach((u) => {
      c[u.role] = (c[u.role] || 0) + 1;
    });
    return c;
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        (roleFilter === "all" || u.role === roleFilter) &&
        (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  }, [users, search, roleFilter]);

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("all");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">User management</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? "Loading…" : `${users.length} ${users.length === 1 ? "person" : "people"} in your company`}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add user
        </button>
      </div>

      {notice && (
        <div role="status" className="mt-6 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {notice}
        </div>
      )}

      {error && (
        <div role="alert" className="mt-6 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </span>
          <button onClick={loadUsers} className="font-semibold underline underline-offset-2">
            Retry
          </button>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key)}
              aria-pressed={roleFilter === f.key}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                roleFilter === f.key
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {f.label} <span className="opacity-60">{counts[f.key] || 0}</span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            aria-label="Search users"
            className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-4 p-5" aria-label="Loading users">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-56 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Users className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-slate-900">
              {users.length === 0 ? "No users yet" : "No one matches your search"}
            </p>
            {users.length > 0 && (
              <button onClick={clearFilters} className="mt-2 text-sm font-semibold text-amber-600 hover:text-amber-700">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Added</th>
                  <th className="px-4 py-3 font-medium">Remove User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size="md" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">
                            {u.name}
                            {u.id === me.id && (
                              <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">You</span>
                            )}
                          </p>
                          <p className="truncate text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill active={u.isActive} />
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 font-bold"><Trash /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && <AddUserModal onClose={closeModal} onCreated={handleCreated} />}
    </div>
  );
}
