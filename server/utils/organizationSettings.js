import OrganizationSetting from "../models/OrganizationSetting.js";

export const DEFAULT_ORGANIZATION_SETTINGS = {
  sickLeaveAllowance: 12,
  casualLeaveAllowance: 12,
  annualLeaveAllowance: 18,
  annualLeavePayoutEnabled: false,
  annualLeavePayoutRate: 0,
  currencyCode: "INR",
  currencySymbol: "Rs",
};

export const getOrganizationSettings = async () => {
  const settings = await OrganizationSetting.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default", ...DEFAULT_ORGANIZATION_SETTINGS } },
    { new: true, upsert: true },
  ).lean();

  return settings;
};
