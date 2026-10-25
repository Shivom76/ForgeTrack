// Must match server/constants/index.js
export const ASSET_TYPES = [
  { value: "excavator", label: "Excavator" },
  { value: "truck", label: "Truck" },
  { value: "generator", label: "Generator" },
  { value: "crane", label: "Crane" },
  { value: "other", label: "Other" },
];

export const ASSET_STATUSES = [
  { value: "operational", label: "Operational" },
  { value: "maintenance", label: "Under maintenance" },
  { value: "decommissioned", label: "Decommissioned" },
];

export const typeLabel = (value) => ASSET_TYPES.find((t) => t.value === value)?.label || value;
export const statusLabel = (value) => ASSET_STATUSES.find((s) => s.value === value)?.label || value;

// Dates are stored at UTC midnight, so read and write them in UTC.
// Otherwise users west of UTC would see the previous day.
export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      })
    : "—";

export const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

// Assets come back with both `id` and `_id`; populated users may have either. Be safe.
export const idOf = (doc) => (doc ? doc.id ?? doc._id : undefined);
