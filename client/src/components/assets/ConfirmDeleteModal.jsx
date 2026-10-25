import { useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { idOf } from "../../lib/assets";
import ModalShell from "../ModalShell";

export default function ConfirmDeleteModal({ asset, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setError("");
    setBusy(true);
    try {
      const res = await api(`/assets/${idOf(asset)}`, { method: "DELETE" });
      onDone(res.message);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title="Delete this asset?">
      <div className="space-y-4">
        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{asset.name}</span> (
          <span className="font-mono">{asset.serialNumber}</span>) will be removed permanently. This can’t be undone.
        </p>
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Tip: if the machine is just retired, set its status to “Decommissioned” instead. That keeps the record.
        </p>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {busy ? "Deleting…" : "Delete asset"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
