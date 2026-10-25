// End-to-end smoke test: tenant isolation, role rules, and auth edge cases.
// Run with the server already started:   node tests/smoke.test.mjs
// Needs Node 18+ (built-in fetch). Override target with API_URL=http://host:port/api
const BASE = process.env.API_URL || "http://localhost:5000/api";
const run = Date.now().toString(36);
const PASSWORD = "Password123";

let passed = 0;
let failed = 0;

const api = async (method, path, { token, body } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { status: res.status, json };
};

const check = (name, condition, detail) => {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}`, detail !== undefined ? JSON.stringify(detail) : "");
  }
};

const section = (title) => console.log(`\n${title}`);

const main = async () => {
  // ---------------------------------------------------------------- onboarding
  section("1. Tenant onboarding");
  const a = await api("POST", "/auth/register-tenant", {
    body: {
      companyName: `Alpha Build ${run}`,
      contactEmail: `admin.a.${run}@example.com`,
      adminName: "Alice Admin",
      adminPassword: PASSWORD,
    },
  });
  check("Tenant A registers (201) and receives a token", a.status === 201 && !!a.json?.token, a.json);

  const b = await api("POST", "/auth/register-tenant", {
    body: {
      companyName: `Beta Mining ${run}`,
      contactEmail: `admin.b.${run}@example.com`,
      adminName: "Bob Admin",
      adminPassword: PASSWORD,
    },
  });
  check("Tenant B registers (201)", b.status === 201 && !!b.json?.token, b.json);
  if (!a.json?.token || !b.json?.token) {
    console.log("\nCannot continue without both tenants. Is the server running?");
    process.exit(1);
  }

  const dup = await api("POST", "/auth/register-tenant", {
    body: {
      companyName: `Alpha Build ${run}`,
      contactEmail: `other.${run}@example.com`,
      adminName: "Dup",
      adminPassword: PASSWORD,
    },
  });
  check("Duplicate company name rejected (409)", dup.status === 409, dup.json);

  const weak = await api("POST", "/auth/register-tenant", {
    body: { companyName: `Weak ${run}`, contactEmail: `w.${run}@example.com`, adminName: "Weak", adminPassword: "123" },
  });
  check("Weak password rejected (400)", weak.status === 400, weak.json);

  const tokenA = a.json.token;
  const tokenB = b.json.token;
  const tenantA = a.json.tenant;
  const tenantB = b.json.tenant;

  // --------------------------------------------------------------------- auth
  section("2. Authentication");
  const noToken = await api("GET", "/assets");
  check("No token -> 401", noToken.status === 401, noToken.json);
  const badToken = await api("GET", "/assets", { token: "garbage.token.value" });
  check("Garbage token -> 401", badToken.status === 401, badToken.json);

  const wrongPass = await api("POST", "/auth/login", {
    body: { companyCode: tenantA.companyCode, email: `admin.a.${run}@example.com`, password: "WrongPass999" },
  });
  const wrongCompany = await api("POST", "/auth/login", {
    body: { companyCode: "no-such-company", email: `admin.a.${run}@example.com`, password: PASSWORD },
  });
  check("Wrong password -> 401", wrongPass.status === 401, wrongPass.json);
  check("Wrong company -> 401", wrongCompany.status === 401, wrongCompany.json);
  check(
    "Both failures use the same message (no user enumeration)",
    wrongPass.json?.message === wrongCompany.json?.message
  );

  const injection = await api("POST", "/auth/login", {
    body: { companyCode: tenantA.companyCode, email: { $ne: null }, password: { $ne: null } },
  });
  check("NoSQL-injection payload rejected (400)", injection.status === 400, injection.json);

  const me = await api("GET", "/auth/me", { token: tokenA });
  check("/auth/me returns the right user and tenant", me.status === 200 && me.json?.tenant?.id === tenantA.id, me.json);
  check("Password hash never returned", !JSON.stringify(me.json).includes("password"));

  // -------------------------------------------------------- tenant isolation
  section("3. Tenant isolation");
  const assetA = await api("POST", "/assets", {
    token: tokenA,
    body: { name: "CAT 320 Excavator", type: "excavator", serialNumber: "EX-001" },
  });
  check("A creates asset EX-001 (201)", assetA.status === 201, assetA.json);

  const assetB = await api("POST", "/assets", {
    token: tokenB,
    body: { name: "Komatsu Excavator", type: "excavator", serialNumber: "EX-001" },
  });
  check("B can reuse serial EX-001 (unique per tenant, not global)", assetB.status === 201, assetB.json);

  const dupAsset = await api("POST", "/assets", {
    token: tokenA,
    body: { name: "Another", type: "truck", serialNumber: "ex-001" },
  });
  check("A duplicate serial in same tenant -> 409 (case-insensitive)", dupAsset.status === 409, dupAsset.json);

  const auto = await api("POST", "/assets", { token: tokenA, body: { name: "Generator", type: "generator" } });
  check("Serial auto-generated when omitted", auto.status === 201 && /^AST-[0-9A-F]{6}$/.test(auto.json?.asset?.serialNumber || ""), auto.json);
  check("Default status is 'operational'", auto.json?.asset?.status === "operational", auto.json);

  const badType = await api("POST", "/assets", { token: tokenA, body: { name: "X", type: "spaceship" } });
  check("Invalid asset type -> 400", badType.status === 400, badType.json);

  const listA = await api("GET", "/assets", { token: tokenA });
  check(
    "A sees only A's assets",
    listA.status === 200 && listA.json.data.length === 2 && listA.json.data.every((x) => x.tenantId === tenantA.id),
    listA.json
  );
  const listB = await api("GET", "/assets", { token: tokenB });
  check("B sees only B's single asset", listB.json?.data?.length === 1 && listB.json.data[0].tenantId === tenantB.id, listB.json);
  check("List response is paginated { data, page, total, totalPages }",
    ["data", "page", "total", "totalPages"].every((k) => k in (listA.json || {})));

  const idA = assetA.json.asset._id;
  const stealGet = await api("GET", `/assets/${idA}`, { token: tokenB });
  check("B cannot READ A's asset (404)", stealGet.status === 404, stealGet.json);
  const stealPatch = await api("PATCH", `/assets/${idA}`, { token: tokenB, body: { name: "hacked" } });
  check("B cannot UPDATE A's asset (404)", stealPatch.status === 404, stealPatch.json);
  const stealDel = await api("DELETE", `/assets/${idA}`, { token: tokenB });
  check("B cannot DELETE A's asset (404)", stealDel.status === 404, stealDel.json);
  const stealAssign = await api("POST", `/assets/${idA}/assign`, { token: tokenB, body: { userId: b.json.user.id } });
  check("B cannot ASSIGN A's asset (404)", stealAssign.status === 404, stealAssign.json);

  const stillThere = await api("GET", `/assets/${idA}`, { token: tokenA });
  check("A's asset is untouched after B's attempts", stillThere.status === 200 && stillThere.json.asset.name === "CAT 320 Excavator", stillThere.json);

  const crossAssign = await api("POST", `/assets/${idA}/assign`, { token: tokenA, body: { userId: b.json.user.id } });
  check("A cannot assign A's asset to a user from tenant B (404)", crossAssign.status === 404, crossAssign.json);

  const bodyTenant = await api("POST", "/assets", {
    token: tokenA,
    body: { name: "Sneaky", type: "truck", tenantId: tenantB.id },
  });
  check("tenantId in request body is ignored", bodyTenant.status === 201 && bodyTenant.json.asset.tenantId === tenantA.id, bodyTenant.json);

  // ------------------------------------------------- same email, two tenants
  section("4. Same email in two tenants");
  const shared = `shared.${run}@example.com`;
  const mgrA = await api("POST", "/users", {
    token: tokenA,
    body: { name: "Shared Manager", email: shared, password: PASSWORD, role: "operationManager" },
  });
  const mgrB = await api("POST", "/users", {
    token: tokenB,
    body: { name: "Shared Technician", email: shared, password: PASSWORD, role: "fieldTechnician" },
  });
  check("Same email allowed in tenant A and tenant B", mgrA.status === 201 && mgrB.status === 201, [mgrA.json, mgrB.json]);

  const dupUser = await api("POST", "/users", {
    token: tokenA,
    body: { name: "Again", email: shared.toUpperCase(), password: PASSWORD, role: "fieldTechnician" },
  });
  check("Same email twice in one tenant -> 409", dupUser.status === 409, dupUser.json);

  const loginA = await api("POST", "/auth/login", { body: { companyCode: tenantA.companyCode, email: shared, password: PASSWORD } });
  const loginB = await api("POST", "/auth/login", { body: { companyCode: tenantB.companyCode, email: shared, password: PASSWORD } });
  check("Login with company A code gets tenant A's user", loginA.json?.user?.tenantId === tenantA.id && loginA.json.user.role === "operationManager", loginA.json);
  check("Login with company B code gets tenant B's user", loginB.json?.user?.tenantId === tenantB.id && loginB.json.user.role === "fieldTechnician", loginB.json);

  // ------------------------------------------------------------- role rules
  section("5. Role rules");
  const techEmail = `tech.${run}@example.com`;
  const tech = await api("POST", "/users", {
    token: tokenA,
    body: { name: "Tom Tech", email: techEmail, password: PASSWORD, role: "fieldTechnician" },
  });
  check("Admin creates a technician (201, auto-approved)", tech.status === 201 && tech.json.user.isApproved === true, tech.json);
  const techLogin = await api("POST", "/auth/login", { body: { companyCode: tenantA.companyCode, email: techEmail, password: PASSWORD } });
  const tokenTech = techLogin.json?.token;
  const tokenMgr = loginA.json?.token;
  check("Technician can log in", !!tokenTech, techLogin.json);

  const techList0 = await api("GET", "/assets", { token: tokenTech });
  check("Technician sees 0 assets before assignment", techList0.json?.data?.length === 0, techList0.json);

  const assign = await api("POST", `/assets/${idA}/assign`, { token: tokenMgr, body: { userId: tech.json.user.id } });
  check("Manager assigns asset to technician", assign.status === 200 && assign.json.asset.assignedTo?.name === "Tom Tech", assign.json);

  const techList1 = await api("GET", "/assets", { token: tokenTech });
  check("Technician now sees exactly their 1 asset", techList1.json?.data?.length === 1 && techList1.json.data[0]._id === idA, techList1.json);

  const techOther = await api("GET", `/assets/${auto.json.asset._id}`, { token: tokenTech });
  check("Technician cannot open an asset not assigned to them (404)", techOther.status === 404, techOther.json);

  const techStatus = await api("PATCH", `/assets/${idA}`, { token: tokenTech, body: { status: "maintenance" } });
  check("Technician can update status of own asset", techStatus.status === 200 && techStatus.json.asset.status === "maintenance", techStatus.json);
  const techName = await api("PATCH", `/assets/${idA}`, { token: tokenTech, body: { name: "Renamed" } });
  check("Technician cannot rename asset (403)", techName.status === 403, techName.json);
  const techCreate = await api("POST", "/assets", { token: tokenTech, body: { name: "X", type: "truck" } });
  check("Technician cannot create assets (403)", techCreate.status === 403, techCreate.json);
  const techUsers = await api("GET", "/users", { token: tokenTech });
  check("Technician cannot list users (403)", techUsers.status === 403, techUsers.json);

  const mgrDelete = await api("DELETE", `/assets/${idA}`, { token: tokenMgr });
  check("Manager cannot delete assets (403)", mgrDelete.status === 403, mgrDelete.json);
  const mgrCreateUser = await api("POST", "/users", { token: tokenMgr, body: { name: "Nope", email: `n.${run}@example.com`, password: PASSWORD, role: "fieldTechnician" } });
  check("Manager cannot create users (403)", mgrCreateUser.status === 403, mgrCreateUser.json);
  const mgrList = await api("GET", "/users?role=fieldTechnician", { token: tokenMgr });
  check("Manager can list technicians (for the assign dropdown)", mgrList.status === 200 && mgrList.json.data.every((u) => u.role === "fieldTechnician"), mgrList.json);

  const due = await api("PATCH", `/assets/${auto.json.asset._id}`, {
    token: tokenMgr,
    body: { nextServiceDate: new Date(Date.now() - 2 * 864e5).toISOString() },
  });
  check("Manager sets a past service date -> isServiceOverdue is true", due.json?.asset?.isServiceOverdue === true, due.json);
  const dueList = await api("GET", "/assets?dueWithinDays=7", { token: tokenMgr });
  check("dueWithinDays=7 returns the overdue asset", dueList.json?.data?.some((x) => x._id === auto.json.asset._id), dueList.json);

  // ------------------------------------------------ account lifecycle
  section("6. Deactivation and self-protection");
  const selfDeactivate = await api("PATCH", `/users/${a.json.user.id}`, { token: tokenA, body: { isActive: false } });
  check("Admin cannot deactivate themselves (400)", selfDeactivate.status === 400, selfDeactivate.json);

  const deactivate = await api("PATCH", `/users/${tech.json.user.id}`, { token: tokenA, body: { isActive: false } });
  check("Admin deactivates the technician", deactivate.status === 200, deactivate.json);
  const staleToken = await api("GET", "/assets", { token: tokenTech });
  check("Deactivated user's EXISTING token stops working immediately (401)", staleToken.status === 401, staleToken.json);
  const reLogin = await api("POST", "/auth/login", { body: { companyCode: tenantA.companyCode, email: techEmail, password: PASSWORD } });
  check("Deactivated user cannot log in (403)", reLogin.status === 403, reLogin.json);

  const promote = await api("PATCH", `/users/${mgrA.json.user.id}`, { token: tokenA, body: { role: "tenantAdmin" } });
  const nowAdmin = await api("GET", "/users", { token: tokenMgr });
  check("Role change applies to the existing token immediately", promote.status === 200 && nowAdmin.status === 200, promote.json);
  const crossUserEdit = await api("PATCH", `/users/${b.json.user.id}`, { token: tokenA, body: { role: "fieldTechnician" } });
  check("A cannot edit a user in tenant B (404)", crossUserEdit.status === 404, crossUserEdit.json);

  // ------------------------------------------------------------- misc
  section("7. Misc");
  const badId = await api("GET", "/assets/not-an-id", { token: tokenA });
  check("Malformed id -> 404, not a 500", badId.status === 404, badId.json);
  const unknown = await api("GET", "/nope");
  check("Unknown route -> JSON 404", unknown.status === 404 && !!unknown.json?.message, unknown.json);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
};

main().catch((err) => {
  console.error("\nTest run crashed:", err.message);
  console.error("Is the API running at", BASE, "?");
  process.exit(1);
});
