// Single source of truth for role / enum strings.
// Import these instead of typing "tenantAdmin" etc. by hand (typos = silent 403s).
const ROLES = Object.freeze({
  ADMIN: "tenantAdmin",
  MANAGER: "operationManager",
  TECHNICIAN: "fieldTechnician",
});

const ROLE_LIST = Object.values(ROLES);

const ASSET_TYPES = ["excavator", "truck", "generator", "crane", "other"];
const ASSET_STATUSES = ["operational", "maintenance", "decommissioned"];

module.exports = { ROLES, ROLE_LIST, ASSET_TYPES, ASSET_STATUSES };
