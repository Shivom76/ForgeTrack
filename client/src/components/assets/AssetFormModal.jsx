import { useState } from "react";
import { api } from "../../lib/api";
import { ASSET_STATUSES, ASSET_TYPES, idOf, toDateInput, typeLabel } from "../../lib/assets";
import ModalShell from "../ModalShell";
import Field from "../Field";
import Select from "../Select";
import Button from "../Button";

// asset  = undefined -> "Add asset"
// asset  = {...}     -> "Edit asset"
// limited = true     -> field technicians: they can only change the STATUS of their own assets
export default function AssetFormModal({ asset, limited = false, onClose, onSaved }) {
  const isEdit = Boolean(asset);
  const [form, setForm] = useState(() => ({
    name: asset?.name || "",
    type: asset?.type || "excavator",
    serialNumber: asset?.serialNumber || "",
    status: asset?.status || "operational",
    location: asset?.location || "",
    lastServiceDate: toDateInput(asset?.lastServiceDate),
    nextServiceDate: toDateInput(asset?.nextServiceDate),
  }));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    let body;
    if (limited) {
      body = { status: form.status };
    } else {
      body = {
        name: form.name.trim(),
        type: form.type,
        status: form.status,
        location: form.location.trim(),
        lastServiceDate: form.lastServiceDate || null,
        nextServiceDate: form.nextServiceDate || null,
      };
      // On create, a blank serial means "generate one for me"
      if (isEdit || form.serialNumber.trim()) body.serialNumber = form.serialNumber.trim();
    }

    try {
      const res = isEdit
        ? await api(`/assets/${idOf(asset)}`, { method: "PATCH", body })
        : await api("/assets", { method: "POST", body });
      onSaved(res.message);
    } catch (err) {
      setError(err.message); // e.g. "serialNumber already exists"
      setSubmitting(false);
    }
  };

  const statusOptions = ASSET_STATUSES.filter((s) => !limited || s.value !== "decommissioned");

  return (
    <ModalShell
      size="lg"
      onClose={onClose}
      title={limited ? "Update status" : isEdit ? "Edit asset" : "Add asset"}
      description={
        limited
          ? "Let your manager know when this machine goes into or out of maintenance."
          : isEdit
          ? "Changes apply immediately for everyone in your company."
          : "Add a machine to your fleet."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {limited ? (
          <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
            <p className="font-medium text-slate-900">{asset.name}</p>
            <p className="text-slate-500">
              {typeLabel(asset.type)} · <span className="font-mono">{asset.serialNumber}</span>
            </p>
          </div>
        ) : (
          <>
            <Field label="Name" id="name" name="name" placeholder="CAT 320 Excavator" value={form.name} onChange={handleChange} required autoFocus />

            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Type" id="type" name="type" value={form.type} onChange={handleChange}>
                {ASSET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
              <Field
                label="Serial number"
                id="serialNumber"
                name="serialNumber"
                placeholder="EX-001"
                hint={isEdit ? undefined : "Leave blank to auto-generate."}
                value={form.serialNumber}
                onChange={handleChange}
                required={isEdit}
              />
            </div>

            <Field label="Location" id="location" name="location" placeholder="Site A, Bengaluru" value={form.location} onChange={handleChange} />
          </>
        )}

        <Select label="Status" id="status" name="status" value={form.status} onChange={handleChange}>
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>

        {!limited && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Last serviced" id="lastServiceDate" name="lastServiceDate" type="date" value={form.lastServiceDate} onChange={handleChange} />
            <Field label="Next service due" id="nextServiceDate" name="nextServiceDate" type="date" value={form.nextServiceDate} onChange={handleChange} />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <Button type="submit" loading={submitting}>
            {submitting ? "Saving…" : isEdit || limited ? "Save changes" : "Add asset"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
