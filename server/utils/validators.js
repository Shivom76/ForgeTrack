const bcrypt = require("bcrypt");
const { httpError } = require("./http");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const assertValidEmail = (email) => {
  if (!EMAIL_RE.test(email.trim())) throw httpError(400, "Invalid email address");
};

const assertValidPassword = (password) => {
  if (password.length < 8) {
    throw httpError(400, "Password must be at least 8 characters");
  }
  // bcrypt silently ignores anything past 72 bytes
  if (Buffer.byteLength(password) > 72) {
    throw httpError(400, "Password must be at most 72 bytes");
  }
};

const hashPassword = (password) =>
  bcrypt.hash(password, parseInt(process.env.SALT_NUM, 10) || 12);

// "Alpha Build Co." -> "alpha-build-co"  (used as the login "company code")
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

module.exports = { assertValidEmail, assertValidPassword, hashPassword, slugify };
