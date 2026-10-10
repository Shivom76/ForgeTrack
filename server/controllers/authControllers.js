const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const Tenant = require("../models/tenantModel");
const { ROLES } = require("../constants");
const { asyncHandler, httpError, requireFields } = require("../utils/http");
const {
  assertValidEmail,
  assertValidPassword,
  hashPassword,
  slugify,
} = require("../utils/validators");

// Compared against when the user doesn't exist, so response time doesn't
// reveal whether an email/company is registered.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const signToken = (user) =>
  jwt.sign(
    { userId: user._id, tenantId: user.tenantId },
    process.env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

const tenantDto = (tenant) => ({
  id: tenant._id,
  companyName: tenant.companyName,
  companyCode: tenant.slug,
});

// POST /api/auth/register-tenant
module.exports.registerTenant = asyncHandler(async (req, res) => {
  requireFields(req.body, ["companyName", "contactEmail", "adminName", "adminPassword"]);
  const { companyName, contactEmail, adminName, adminPassword } = req.body;
  assertValidEmail(contactEmail);
  assertValidPassword(adminPassword);

  const slug = slugify(companyName);
  if (!slug) throw httpError(400, "Company name must contain letters or numbers");

  const exists = await Tenant.exists({
    $or: [{ companyName: companyName.trim() }, { slug }],
  });
  if (exists) throw httpError(409, "A company with this name is already registered");

  const passwordHash = await hashPassword(adminPassword);
  const tenant = await Tenant.create({ companyName, slug, contactEmail });

  let admin;
  try {
    admin = await User.create({
      tenantId: tenant._id,
      name: adminName,
      email: contactEmail,
      password: passwordHash,
      role: ROLES.ADMIN,
      isApproved: true,
    });
  } catch (err) {
    // No orphan tenants if the admin user fails validation.
    await Tenant.deleteOne({ _id: tenant._id });
    throw err;
  }

  // Return a token so the frontend can go straight to the dashboard after sign-up.
  res.status(201).json({
    message: `${tenant.companyName} registered`,
    token: signToken(admin),
    user: admin,
    tenant: tenantDto(tenant),
  });
});

// POST /api/auth/login   { companyCode, email, password }
module.exports.login = asyncHandler(async (req, res) => {
  requireFields(req.body, ["companyCode", "email", "password"]);
  const { companyCode, email, password } = req.body;

  const tenant = await Tenant.findOne({ slug: companyCode.trim().toLowerCase() });
  const user = tenant
    ? await User.findOne({
        tenantId: tenant._id,
        email: email.trim().toLowerCase(),
      }).select("+password")
    : null;

  const matches = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

  // One generic message: don't reveal which part was wrong.
  if (!user || !matches) {
    throw httpError(401, "Invalid company code, email or password");
  }
  if (!user.isActive) {
    throw httpError(403, "Your account has been deactivated. Contact your admin.");
  }
  if (!user.isApproved) {
    throw httpError(403, "Your account is pending admin approval.");
  }

  res.json({
    message: "Login successful",
    token: signToken(user),
    user, // password stripped by the schema's toJSON
    tenant: tenantDto(tenant),
  });
});

// GET /api/auth/me   -> frontend calls this on every page load to restore the session
module.exports.me = asyncHandler(async (req, res) => {
  const [user, tenant] = await Promise.all([
    User.findOne({ _id: req.user.userId, tenantId: req.user.tenantId }),
    Tenant.findById(req.user.tenantId),
  ]);
  if (!user || !tenant) throw httpError(401, "Account not found");
  res.json({ user, tenant: tenantDto(tenant) });
});
