import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  Truck,
  UserPlus,
} from "lucide-react";
import { api } from "../lib/api";
import { ROLES } from "../lib/roles";
import { ASSET_STATUSES, ASSET_TYPES, formatDate, idOf, typeLabel } from "../lib/assets";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import AssetStatusPill from "../components/assets/AssetStatusPill";
import AssetFormModal from "../components/assets/AssetFormModal";
import AssignModal from "../components/assets/AssignModal";
import ConfirmDeleteModal from "../components/assets/ConfirmDeleteModal";

const PAGE_SIZE = 10;

const SORTS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt", label: "Oldest first" },
  { value: "name", label: "Name A–Z" },
  { value: "-name", label: "Name Z–A" },
];

const selectClass =
  "rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30";

const iconButton =
  "rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";

const emptyResult = { data: [], total: 0, page: 1, totalPages: 1 };

export default function AssetsPage() {
  const { user: me } = useAuth();
  const isTech = me.role === ROLES.TECHNICIAN;
  const isAdmin = me.role === ROLES.ADMIN;
  const canManage = !isTech; // admins and operation managers

  // ---- Filters live in the URL: shareable, survive refresh, and the Home cards can link here.
  const [params, setParams] = useSearchParams();
  const filters = {
    q: params.get("q") || "",
    type: params.get("type") || "",
    status: params.get("status") || "",
    assignedTo: params.get("assignedTo") || "",
    due: params.get("due") === "7",
    sort: SORTS.some((s) => s.value === params.get("sort")) ? params.get("sort") : "-createdAt",
    page: Math.max(parseInt(params.get("page"), 10) || 1, 1),
  };

  // Change some filters. Any change except `page` itself sends you back to page 1.
  const setFilter = useCallback(
    (patch) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value === "" || value === false || value == null) next.delete(key);
            else next.set(key, String(value));
          }
          if (!("page" in patch)) next.delete("page");
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  // ---- Search box: type freely, URL updates 300ms after you stop
  const [searchText, setSearchText] = useState(filters.q);
  useEffect(() => {
    // keep the box in sync when the URL changes from outside (e.g. "Clear filters")
    setSearchText((prev) => (prev.trim() === filters.q ? prev : filters.q));
  }, [filters.q]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText.trim() !== filters.q) setFilter({ q: searchText.trim() });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText, filters.q, setFilter]);

  // ---- Data
  const [result, setResult] = useState(emptyResult);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  const paramString = params.toString();
  const query = useMemo(() => {
    const qs = new URLSearchParams({
      page: String(filters.page),
      limit: String(PAGE_SIZE),
      sort: filters.sort,
    });
    if (filters.q) qs.set("search", filters.q);
    if (filters.type) qs.set("type", filters.type);
    if (filters.status) qs.set("status", filters.status);
    if (filters.assignedTo && !isTech) qs.set("assignedTo", filters.assignedTo);
    if (filters.due) qs.set("dueWithinDays", "7");
    return qs.toString();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramString, isTech]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    api(`/assets?${query}`, { signal: controller.signal })
      .then((res) => {
        // e.g. you deleted the last item on the last page: step back to the new last page
        if (res.data.length === 0 && res.total > 0 && res.page > res.totalPages) {
          setFilter({ page: res.totalPages });
          return;
        }
        setResult(res);
        setError("");
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message);
        setLoading(false);
      });

    return () => controller.abort();
  }, [query, reloadKey, setFilter]);

  // ---- People for the assignee filter and the Assign dialog (technicians can't list users)
  const [people, setPeople] = useState([]);
  useEffect(() => {
    if (!canManage) return;
    api("/users?limit=100")
      .then((res) => setPeople(res.data.filter((u) => u.isActive)))
      .catch(() => {
        // not critical: the filter and dialog just show fewer options
      });
  }, [canManage]);

  // ---- Dialogs and success message
  const [modal, setModal] = useState(null); // { type: "form" | "assign" | "delete", asset? }
  const [notice, setNotice] = useState("");
  const closeModal = useCallback(() => setModal(null), []);
  const handleDone = (message) => {
    setModal(null);
    setNotice(message);
    reload();
  };
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const items = result.data;
  const hasFilters = Boolean(filters.q || filters.type || filters.status || filters.assignedTo || filters.due);
  const clearFilters = () => {
    setSearchText("");
    setParams({}, { replace: true });
  };
  const firstShown = (result.page - 1) * PAGE_SIZE + 1;
  const lastShown = firstShown + items.length - 1;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{isTech ? "My assets" : "Assets"}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading && items.length === 0
              ? "Loading…"
              : `${result.total} ${result.total === 1 ? "asset" : "assets"}${
                  hasFilters ? " match your filters" : isTech ? " assigned to you" : " in your fleet"
                }`}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setModal({ type: "form" })}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add asset
          </button>
        )}
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
          <button onClick={reload} className="font-semibold underline underline-offset-2">
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search name or serial"
            aria-label="Search assets"
            className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        <select aria-label="Filter by type" value={filters.type} onChange={(e) => setFilter({ type: e.target.value })} className={selectClass}>
          <option value="">All types</option>
          {ASSET_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select aria-label="Filter by status" value={filters.status} onChange={(e) => setFilter({ status: e.target.value })} className={selectClass}>
          <option value="">All statuses</option>
          {ASSET_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {canManage && (
          <select aria-label="Filter by assignee" value={filters.assignedTo} onChange={(e) => setFilter({ assignedTo: e.target.value })} className={selectClass}>
            <option value="">Everyone</option>
            <option value="unassigned">Unassigned</option>
            {people.map((p) => (
              <option key={idOf(p)} value={idOf(p)}>
                {p.name}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={() => setFilter({ due: filters.due ? "" : "7" })}
          aria-pressed={filters.due}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            filters.due ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50"
          }`}
        >
          Service due in 7 days
        </button>

        <select aria-label="Sort assets" value={filters.sort} onChange={(e) => setFilter({ sort: e.target.value === "-createdAt" ? "" : e.target.value })} className={`${selectClass} ml-auto`}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button onClick={clearFilters} className="text-sm font-semibold text-amber-600 hover:text-amber-700">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading && items.length === 0 ? (
          <div className="space-y-4 p-5" aria-label="Loading assets">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Truck className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-slate-900">
              {hasFilters ? "No assets match your filters" : isTech ? "Nothing is assigned to you yet" : "No assets yet"}
            </p>
            {hasFilters ? (
              <button onClick={clearFilters} className="mt-2 text-sm font-semibold text-amber-600 hover:text-amber-700">
                Clear filters
              </button>
            ) : (
              canManage && (
                <button onClick={() => setModal({ type: "form" })} className="mt-2 text-sm font-semibold text-amber-600 hover:text-amber-700">
                  Add your first asset
                </button>
              )
            )}
          </div>
        ) : (
          <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {canManage && <th className="px-4 py-3 font-medium">Assigned to</th>}
                  <th className="px-4 py-3 font-medium">Next service</th>
                  <th className="px-4 py-3 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((a) => (
                  <tr key={idOf(a)} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{a.name}</p>
                      <p className="text-xs text-slate-500">
                        <span className="font-mono">{a.serialNumber}</span>
                        {a.location && <span> · {a.location}</span>}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{typeLabel(a.type)}</td>
                    <td className="px-4 py-3">
                      <AssetStatusPill status={a.status} />
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        {a.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={a.assignedTo.name} size="sm" />
                            <span className="text-slate-700">{a.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={a.isServiceOverdue ? "font-medium text-red-600" : "text-slate-600"}>
                        {formatDate(a.nextServiceDate)}
                      </span>
                      {a.isServiceOverdue && (
                        <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Overdue</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setModal({ type: "form", asset: a })}
                          aria-label={`${isTech ? "Update status of" : "Edit"} ${a.name}`}
                          title={isTech ? "Update status" : "Edit"}
                          className={iconButton}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {canManage && a.status !== "decommissioned" && (
                          <button
                            onClick={() => setModal({ type: "assign", asset: a })}
                            aria-label={`Assign ${a.name}`}
                            title="Assign"
                            className={iconButton}
                          >
                            <UserPlus className="h-4 w-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => setModal({ type: "delete", asset: a })}
                            aria-label={`Delete ${a.name}`}
                            title="Delete"
                            className={`${iconButton} hover:bg-red-50 hover:text-red-600`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {result.total > 0 && items.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
            <span>
              Showing {firstShown}–{lastShown} of {result.total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter({ page: filters.page - 1 })}
                disabled={result.page <= 1 || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous
              </button>
              <span className="px-1">
                Page {result.page} of {result.totalPages}
              </span>
              <button
                onClick={() => setFilter({ page: filters.page + 1 })}
                disabled={result.page >= result.totalPages || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {modal?.type === "form" && (
        <AssetFormModal asset={modal.asset} limited={isTech} onClose={closeModal} onSaved={handleDone} />
      )}
      {modal?.type === "assign" && (
        <AssignModal asset={modal.asset} people={people} onClose={closeModal} onDone={handleDone} />
      )}
      {modal?.type === "delete" && (
        <ConfirmDeleteModal asset={modal.asset} onClose={closeModal} onDone={handleDone} />
      )}
    </div>
  );
}
