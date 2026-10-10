const crypto = require("crypto");
const Asset = require("../models/assetModel");
const User = require("../models/userModel");
const { ROLES, ASSET_TYPES, ASSET_STATUSES } = require("../constants");
const {
  asyncHandler,
  httpError,
  requireFields,
  isObjectId,
  escapeRegex,
  parsePagination,
  paginated,
} = require("../utils/http");

const POPULATE_ASSIGNEE = { path: "assignedTo", select: "name email role" };
const SORTABLE = {
  name: "name",
  status: "status",
  createdAt: "createdAt",
  nextServiceDate: "nextServiceDate",
};

const generateSerial = () =>
  `AST-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

const assertString = (value, field) => {
  if (typeof value !== "string" || !value.trim()) {
    throw httpError(400, `${field} must be a non-empty string`);
  }
};

const parseDate = (value, field) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw httpError(400, `Invalid date for ${field}`);
  return d;
};

// ALWAYS scoped by tenant. Technicians can only ever see their own assets;
// anything else returns 404 (not 403) so existence isn't leaked.
const findTenantAsset = async (req) => {
  const filter = { _id: req.params.id, tenantId: req.user.tenantId };
  if (req.user.role === ROLES.TECHNICIAN) filter.assignedTo = req.user.userId;
  const asset = await Asset.findOne(filter).populate(POPULATE_ASSIGNEE);
  if (!asset) throw httpError(404, "Asset not found");
  return asset;
};

// GET /api/assets
//   ?type=&status=&assignedTo=<userId|unassigned>&search=&dueWithinDays=7
//   &sort=-createdAt&page=1&limit=10
module.exports.listAssets = asyncHandler(async (req, res) => {
  const { type, status, assignedTo, search, sort } = req.query;
  const filter = { tenantId: req.user.tenantId };

  if (ASSET_TYPES.includes(type)) filter.type = type;
  if (ASSET_STATUSES.includes(status)) filter.status = status;

  if (req.user.role === ROLES.TECHNICIAN) {
    filter.assignedTo = req.user.userId; // forced, ignores any query param
  } else if (assignedTo === "unassigned") {
    filter.assignedTo = null;
  } else if (isObjectId(assignedTo)) {
    filter.assignedTo = assignedTo;
  }

  if (typeof search === "string" && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ name: rx }, { serialNumber: rx }];
  }

  // "Needs servicing within N days" (includes already-overdue)
  const days = parseInt(req.query.dueWithinDays, 10);
  if (days > 0) {
    filter.nextServiceDate = { $lte: new Date(Date.now() + days * 864e5) };
    if (!filter.status) filter.status = { $ne: "decommissioned" };
  }

  const sortParam = typeof sort === "string" ? sort : "-createdAt";
  const dir = sortParam.startsWith("-") ? -1 : 1;
  const sortKey = SORTABLE[sortParam.replace(/^-/, "")] || "createdAt";

  const p = parsePagination(req.query);
  const [data, total] = await Promise.all([
    Asset.find(filter)
      .sort({ [sortKey]: dir, _id: -1 })
      .skip(p.skip)
      .limit(p.limit)
      .populate(POPULATE_ASSIGNEE),
    Asset.countDocuments(filter),
  ]);

  res.json(paginated(data, total, p));
});

// GET /api/assets/:id
module.exports.getAsset = asyncHandler(async (req, res) => {
  res.json({ asset: await findTenantAsset(req) });
});

// POST /api/assets   (admin, manager)
module.exports.createAsset = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "type"]);
  const { name, type, status, location } = req.body;
  if (!ASSET_TYPES.includes(type)) {
    throw httpError(400, `Type must be one of: ${ASSET_TYPES.join(", ")}`);
  }
  if (status !== undefined && !ASSET_STATUSES.includes(status)) {
    throw httpError(400, `Status must be one of: ${ASSET_STATUSES.join(", ")}`);
  }

  const serialNumber =
    typeof req.body.serialNumber === "string" && req.body.serialNumber.trim()
      ? req.body.serialNumber.trim().toUpperCase()
      : generateSerial();

  // The unique {tenantId, serialNumber} index is the real duplicate check;
  // the error handler turns a violation into a clean 409.
  const asset = await Asset.create({
    tenantId: req.user.tenantId,
    name,
    type,
    serialNumber,
    status,
    location: typeof location === "string" ? location : undefined,
    lastServiceDate: parseDate(req.body.lastServiceDate, "lastServiceDate"),
    nextServiceDate: parseDate(req.body.nextServiceDate, "nextServiceDate"),
  });

  res.status(201).json({ message: `Asset ${asset.name} created`, asset });
});

// PATCH /api/assets/:id
//   admin/manager: name, type, serialNumber, status, location, service dates
//   technician   : status only, and only on their own assets
module.exports.updateAsset = asyncHandler(async (req, res) => {
  const asset = await findTenantAsset(req);
  const isTech = req.user.role === ROLES.TECHNICIAN;
  const body = req.body || {};

  const allowed = isTech
    ? ["status"]
    : ["name", "type", "serialNumber", "status", "location", "lastServiceDate", "nextServiceDate"];
  const disallowed = Object.keys(body).filter((k) => !allowed.includes(k));
  if (disallowed.length) {
    throw httpError(
      isTech ? 403 : 400,
      `You cannot update: ${disallowed.join(", ")}. Allowed: ${allowed.join(", ")}`
    );
  }
  if (!Object.keys(body).length) throw httpError(400, "Nothing to update");

  if (body.name !== undefined) {
    assertString(body.name, "name");
    asset.name = body.name;
  }
  if (body.type !== undefined) {
    if (!ASSET_TYPES.includes(body.type)) throw httpError(400, "Invalid type");
    asset.type = body.type;
  }
  if (body.serialNumber !== undefined) {
    assertString(body.serialNumber, "serialNumber");
    asset.serialNumber = body.serialNumber.trim().toUpperCase();
  }
  if (body.status !== undefined) {
    if (!ASSET_STATUSES.includes(body.status)) throw httpError(400, "Invalid status");
    if (isTech && body.status === "decommissioned") {
      throw httpError(403, "Technicians cannot decommission assets");
    }
    asset.status = body.status;
  }
  if (body.location !== undefined) {
    asset.location = typeof body.location === "string" ? body.location : "";
  }
  if (body.lastServiceDate !== undefined) {
    asset.lastServiceDate = parseDate(body.lastServiceDate, "lastServiceDate");
  }
  if (body.nextServiceDate !== undefined) {
    asset.nextServiceDate = parseDate(body.nextServiceDate, "nextServiceDate");
  }

  // A decommissioned machine can't be held by anyone.
  if (asset.status === "decommissioned") asset.assignedTo = null;

  await asset.save();
  res.json({ message: "Asset updated", asset });
});

// DELETE /api/assets/:id   (admin)
module.exports.deleteAsset = asyncHandler(async (req, res) => {
  const result = await Asset.deleteOne({
    _id: req.params.id,
    tenantId: req.user.tenantId,
  });
  if (!result.deletedCount) throw httpError(404, "Asset not found");
  res.json({ message: "Asset removed" });
});

// POST /api/assets/:id/assign   { userId }   (admin, manager)
module.exports.assignAsset = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!isObjectId(userId)) throw httpError(400, "A valid userId is required");

  // The assignee must belong to the SAME tenant and be active.
  const assignee = await User.findOne({
    _id: userId,
    tenantId: req.user.tenantId,
    isActive: true,
    isApproved: true,
  });
  if (!assignee) throw httpError(404, "User not found");

  const asset = await Asset.findOneAndUpdate(
    {
      _id: req.params.id,
      tenantId: req.user.tenantId,
      status: { $ne: "decommissioned" },
    },
    { $set: { assignedTo: assignee._id } },
    { new: true }
  ).populate(POPULATE_ASSIGNEE);
  if (!asset) throw httpError(404, "Asset not found or decommissioned");

  res.json({ message: `Assigned to ${assignee.name}`, asset });
});

// POST /api/assets/:id/unassign   (admin, manager)
module.exports.unassignAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user.tenantId },
    { $set: { assignedTo: null } },
    { new: true }
  );
  if (!asset) throw httpError(404, "Asset not found");
  res.json({ message: "Asset unassigned", asset });
});
