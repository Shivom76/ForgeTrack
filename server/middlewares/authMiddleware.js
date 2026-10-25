const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { asyncHandler, httpError } = require("../utils/http");

// Verifies the JWT, then re-reads the user from the DB so that
//  - role changes take effect immediately (no stale role inside the token)
//  - deactivated users are locked out immediately
module.exports.authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw httpError(401, "Authentication required");

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    throw httpError(401, "Invalid or expired token");
  }

  const user = await User.findOne({
    _id: payload.userId,
    tenantId: payload.tenantId,
  }).select("role isActive isApproved");

  if (!user || !user.isActive || !user.isApproved) {
    throw httpError(401, "Account is not active");
  }

  // tenantId ALWAYS comes from here, never from the request body/query/params.
  req.user = {
    userId: user._id.toString(),
    tenantId: payload.tenantId,
    role: user.role,
  };
  next();
});

module.exports.restrictTo =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!allowedRoles.includes(req.user?.role)) {
      return next(httpError(403, "You do not have access to this resource"));
    }
    next();
  };
