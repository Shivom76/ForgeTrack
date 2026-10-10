const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// Wraps async handlers so any thrown error reaches the central error handler.
// Works on Express 4 and 5.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// Requires each field to be a non-empty STRING. This also blocks NoSQL
// injection like { "email": { "$ne": null } } because objects are rejected.
const requireFields = (body, fields) => {
  const missing = fields.filter(
    (f) => typeof body?.[f] !== "string" || !body[f].trim()
  );
  if (missing.length) {
    throw httpError(400, `Missing or invalid field(s): ${missing.join(", ")}`);
  }
};

const isObjectId = (value) =>
  typeof value === "string" && OBJECT_ID_RE.test(value);

// router.param("id", validateIdParam("Asset"))
const validateIdParam = (label) => (req, res, next, id) =>
  isObjectId(id) ? next() : next(httpError(404, `${label} not found`));

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePagination = (query, { defaultLimit = 10, maxLimit = 100 } = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || defaultLimit, 1),
    maxLimit
  );
  return { page, limit, skip: (page - 1) * limit };
};

// Every list endpoint returns this exact shape so the frontend can reuse one table component.
const paginated = (data, total, { page, limit }) => ({
  data,
  page,
  limit,
  total,
  totalPages: Math.max(Math.ceil(total / limit), 1),
});

module.exports = {
  asyncHandler,
  httpError,
  requireFields,
  isObjectId,
  validateIdParam,
  escapeRegex,
  parsePagination,
  paginated,
};
