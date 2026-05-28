import OrganizationSetting from "../models/OrganizationSetting.js";
import { DEFAULT_ORGANIZATION_SETTINGS, getOrganizationSettings } from "../utils/organizationSettings.js";

export const getSettings = async (req, res) => {
  try {
    const settings = await getOrganizationSettings();
    return res.json(settings);
  } catch (error) {
    console.error("Settings fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch settings" });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const allowed = [
      "sickLeaveAllowance",
      "casualLeaveAllowance",
      "annualLeaveAllowance",
      "annualLeavePayoutEnabled",
      "annualLeavePayoutRate",
      "currencyCode",
      "currencySymbol",
    ];

    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] === undefined) return;

      if (field === "annualLeavePayoutEnabled") {
        updates[field] = req.body[field] === true || req.body[field] === "true";
        return;
      }

      if (field === "currencyCode" || field === "currencySymbol") {
        updates[field] = String(req.body[field] || "").trim();
        return;
      }

      updates[field] = Math.max(Number(req.body[field]) || 0, 0);
    });

    const settings = await OrganizationSetting.findOneAndUpdate(
      { key: "default" },
      {
        $set: updates,
        $setOnInsert: { key: "default" },
      },
      { returnDocument: "after", upsert: true },
    ).lean();

    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error("Settings update error:", error);
    return res.status(500).json({ error: "Failed to update settings" });
  }
};
