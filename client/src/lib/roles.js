// Must match server/constants/index.js exactly.
export const ROLES = {
  ADMIN: "tenantAdmin",
  MANAGER: "operationManager",
  TECHNICIAN: "fieldTechnician",
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.MANAGER]: "Operations Manager",
  [ROLES.TECHNICIAN]: "Field Technician",
};
