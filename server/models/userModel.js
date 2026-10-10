const mongoose = require("mongoose");
const { Schema } = mongoose;
const { ROLES, ROLE_LIST } = require("../constants");

const userSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLE_LIST, default: ROLES.TECHNICIAN },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      // Safety net: a password hash can never leave the server, even by accident.
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

// Same email may exist in different tenants, but only once per tenant.
// (This is why login needs a company code.)
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.index({ tenantId: 1, role: 1 });

module.exports = mongoose.model("User", userSchema);
