const mongoose = require("mongoose");
const { Schema } = mongoose;

const tenantSchema = new Schema(
  {
    companyName: { type: String, required: true, trim: true, unique: true },
    // Used as the "company code" on the login screen: "alpha-build-co"
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    contactEmail: { type: String, required: true, trim: true, lowercase: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tenant", tenantSchema);
