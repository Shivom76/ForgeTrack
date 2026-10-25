const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// One error shape for the whole API: { message, errors?: [{ field, message }] }
// The frontend can map `errors` straight onto form fields.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Duplicate key (unique index)
  if (err.code === 11000) {
    const field =
      Object.keys(err.keyPattern || {}).find((k) => k !== "tenantId") || "value";
    return res.status(409).json({
      message: `${field} already exists`,
      errors: [{ field, message: "Already exists" }],
    });
  }

  // Mongoose schema validation
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({ message: "Validation failed", errors });
  }

  // Bad ObjectId etc.
  if (err.name === "CastError") {
    return res.status(400).json({ message: `Invalid value for ${err.path}` });
  }

  const status = err.status && err.status < 600 ? err.status : 500;
  if (status === 500) console.error(err); // log internally, never leak details
  res.status(status).json({
    message: status === 500 ? "Internal server error" : err.message,
  });
};

module.exports = { notFound, errorHandler };
