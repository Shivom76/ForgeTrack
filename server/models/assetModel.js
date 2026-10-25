const mongoose = require("mongoose");
const { Schema } = mongoose;
const { ASSET_TYPES, ASSET_STATUSES } = require("../constants");

const assetSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    type: { type: String, enum: ASSET_TYPES, required: true },
    serialNumber: { type: String, required: true, trim: true, uppercase: true },
    status: { type: String, enum: ASSET_STATUSES, default: "operational" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
    location: { type: String, trim: true, maxlength: 100, default: "" },
    lastServiceDate: { type: Date, default: null },
    nextServiceDate: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } }
);

// Computed on the server so the frontend never has to re-derive it.
assetSchema.virtual("isServiceOverdue").get(function () {
  return (
    this.status !== "decommissioned" &&
    !!this.nextServiceDate &&
    this.nextServiceDate < new Date()
  );
});

assetSchema.index({ tenantId: 1, serialNumber: 1 }, { unique: true });
assetSchema.index({ tenantId: 1, status: 1 });
assetSchema.index({ tenantId: 1, assignedTo: 1 });
assetSchema.index({ tenantId: 1, nextServiceDate: 1 });

module.exports = mongoose.model("Asset", assetSchema);
