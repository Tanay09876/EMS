import mongoose from "mongoose";

const organizationSettingSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },
    sickLeaveAllowance: { type: Number, default: 12, min: 0 },
    casualLeaveAllowance: { type: Number, default: 12, min: 0 },
    annualLeaveAllowance: { type: Number, default: 18, min: 0 },
    annualLeavePayoutEnabled: { type: Boolean, default: false },
    annualLeavePayoutRate: { type: Number, default: 0, min: 0 },
    currencyCode: { type: String, default: "INR" },
    currencySymbol: { type: String, default: "Rs" },
  },
  { timestamps: true },
);

const OrganizationSetting =
  mongoose.models.OrganizationSetting ||
  mongoose.model("OrganizationSetting", organizationSettingSchema);

export default OrganizationSetting;
