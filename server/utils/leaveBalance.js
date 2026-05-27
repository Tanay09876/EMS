import LeaveApplication from "../models/LeaveApplication.js";
import { getOrganizationSettings } from "./organizationSettings.js";

const startOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getLeaveDays = (leave) => {
  if (leave.totalDays) return leave.totalDays;
  if (leave.type === "HALF_DAY") return 0.5;

  const start = startOfDay(leave.startDate);
  const end = startOfDay(leave.endDate);
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

export const getLeaveBalance = async (employeeId, year = new Date().getFullYear()) => {
  const settings = await getOrganizationSettings();
  const leaveAllowance = {
    SICK: settings.sickLeaveAllowance,
    CASUAL: settings.casualLeaveAllowance,
    ANNUAL: settings.annualLeaveAllowance,
  };
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

  const leaves = await LeaveApplication.find({
    employeeId,
    status: "APPROVED",
    startDate: { $gte: yearStart, $lte: yearEnd },
  }).lean();

  const usedByType = leaves.reduce(
    (acc, leave) => {
      const type = leave.type === "HALF_DAY" ? "CASUAL" : leave.type;
      if (acc[type] != null) acc[type] += getLeaveDays(leave);
      return acc;
    },
    { SICK: 0, CASUAL: 0, ANNUAL: 0 },
  );

  return Object.entries(leaveAllowance).map(([type, allowance]) => ({
    type,
    allowance,
    used: usedByType[type],
    remaining: Math.max(allowance - usedByType[type], 0),
  }));
};
