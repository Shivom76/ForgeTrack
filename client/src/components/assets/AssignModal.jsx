import { useState } from "react";
import { api } from "../../lib/api";
import { idOf } from "../../lib/assets";
import { ROLE_LABELS } from "../../lib/roles";
import ModalShell from "../ModalShell";
import Select from "../Select";
import Button from "../Button";

export default function AssignModal({ asset, people, onClose, onDone }) {
  const current = idOf(asset.assignedTo) || "";
  const [userId, setUserId] = useState(current);
  const [busy, setBusy] = useState(""); // "assign" | "unassign" | ""
  const [error, setError] = useState("");

  const run = async (kind) => {
    setError("");
    setBusy(kind);
    try {
      const res =
        kind === "assign"
          ? await api(`/assets/${idOf(asset)}/assign`, { method: "POST", body: { userId } })
          : await api(`/assets/${idOf(asset)}/unassign`, { method: "POST" });
      onDone(res.message);
    } catch (err) {
      setError(err.message);
      setBusy("");
    }
  };

  return (
    <ModalShell
      onClose={onClose}
      title={`Assign ${asset.name}`}
      description={asset.assignedTo ? `Currently with ${asset.assignedTo.name}.` : "Currently unassigned."}
    >
      <div className="space-y-4">
        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <Select label="Assign to" id="assignee" value={userId} onChange={(e) => setUserId(e.target.value)}>
          <option value="">Choose a person…</option>
          {people.map((p) => (
            <option key={idOf(p)} value={idOf(p)}>
              {p.name} · {ROLE_LABELS[p.role] || p.role}
            </option>
          ))}
        </Select>

        {people.length === 0 && (
          <p className="text-sm text-slate-500">No active users found. Add team members on the Users page first.</p>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          {current && (
            <button
              type="button"
              onClick={() => run("unassign")}
              disabled={Boolean(busy)}
              className="flex-1 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {busy === "unassign" ? "Unassigning…" : "Unassign"}
            </button>
          )}
          <div className="flex-1">
            <Button type="button" onClick={() => run("assign")} loading={busy === "assign"} disabled={!userId || userId === current || Boolean(busy)}>
              Assign
            </Button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
