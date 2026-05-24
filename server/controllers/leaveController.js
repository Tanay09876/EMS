import { scheduleLeaveReminder } from "../jobs/functions.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import sendEmail from "../config/nodemailer.js";
import { leaveDecisionEmail } from "../utils/emailTemplates.js";

const getTotalDays = (startDate, endDate, type) => {
  if (type === "HALF_DAY") return 0.5;
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

// Create leave
// POST /api/leaves
export const createLeave = async (req, res) => {
  try {
    const session = req.session;
    const employee = await Employee.findOne({ userId: session.userId });
    if (!employee) return res.status(404).json({ error: "Employee not found" });
    if (employee.isDeleted) {
      return res.status(403).json({
        error: "Your account is deactivated. You cannot apply for leave.",
      });
    }

    const { type, startDate, endDate, reason, halfDayPeriod } = req.body; // add halfDayPeriod

    if (!type || !startDate || !reason) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Half Day specific validation
    if (type === "HALF_DAY") {
      if (!halfDayPeriod || !["FIRST", "SECOND"].includes(halfDayPeriod)) {
        return res
          .status(400)
          .json({
            error: "halfDayPeriod must be FIRST or SECOND for Half Day leave",
          });
      }
    } else {
      if (!endDate) return res.status(400).json({ error: "Missing fields" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const resolvedEndDate = type === "HALF_DAY" ? startDate : endDate;

    if (new Date(startDate) <= today || new Date(resolvedEndDate) <= today) {
      return res
        .status(400)
        .json({ error: "Leave dates must be in the future" });
    }
    if (new Date(resolvedEndDate) < new Date(startDate)) {
      return res
        .status(400)
        .json({ error: "End date cannot be before start date" });
    }

    const leave = await LeaveApplication.create({
      employeeId: employee._id,
      type,
      startDate: new Date(startDate),
      endDate: new Date(resolvedEndDate),
      reason,
      halfDayPeriod: type === "HALF_DAY" ? halfDayPeriod : null, // add this
      status: "PENDING",
    });

scheduleLeaveReminder(leave._id);

    return res.json({ success: true, data: leave });
  } catch (error) {
    return res.status(500).json({ error: "Failed" });
  }
};

// Get leaves
// GET /api/leaves
export const getLeaves = async (req, res) => {
  try {
    const session = req.session;
    const isAdmin = session.role === "ADMIN";
    if (isAdmin) {
      const status = req.query.status;
      const where = status ? { status } : {};
      const leaves = await LeaveApplication.find(where)
        .populate("employeeId")
        .sort({ createdAt: -1 });
      const data = leaves.map((l) => {
        const obj = l.toObject();
        return {
          ...obj,
          id: obj._id.toString(),
          employee: obj.employeeId,
          employeeId: obj.employeeId?._id?.toString(),
        };
      });
      return res.json({ data });
    } else {
      const employee = await Employee.findOne({
        userId: session.userId,
      }).lean();
      if (!employee) return res.status(404).json({ error: "Not found" });
      const leaves = await LeaveApplication.find({
        employeeId: employee._id,
      }).sort({ createdAt: -1 });
      return res.json({
        data: leaves,
        employee: { ...employee, id: employee._id.toString() },
      });
    }
  } catch (error) {
    return res.status(500).json({ error: "Failed" });
  }
};

// Update leave status
// PATCH /api/leaves/:id
export const updateLeaveStatus = async (req, res) => {
  try {
    const { status, adminRemark } = req.body;
    if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    if (status === "REJECTED" && !adminRemark?.trim()) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }

    const existingLeave = await LeaveApplication.findById(
      req.params.id,
    ).populate("employeeId");
    if (!existingLeave)
      return res.status(404).json({ error: "Leave application not found" });

    // const totalDays = getTotalDays(existingLeave.startDate, existingLeave.endDate);
    const totalDays = getTotalDays(
      existingLeave.startDate,
      existingLeave.endDate,
      existingLeave.type,
    );
    const leave = await LeaveApplication.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminRemark: adminRemark || "",
        totalDays,
        respondedAt: new Date(),
      },
      { returnDocument: "after" },
    ).populate("employeeId");

    const employee = leave.employeeId;
    sendEmail({
      to: employee.email,
      subject: `Leave request ${status.toLowerCase()}`,
      body: leaveDecisionEmail({
        name: `${employee.firstName} ${employee.lastName}`,
        status,
        type: leave.type,
        startDate: leave.startDate,
        endDate: leave.endDate,
        totalDays,
        reason: leave.reason,
        adminRemark: leave.adminRemark,
        halfDayPeriod: leave.halfDayPeriod, // add this
      }),
    }).catch((mailError) =>
      console.error("Leave decision email error:", mailError),
    );

    return res.json({ success: true, data: leave });
  } catch (error) {
    console.error("Leave status error:", error);
    return res.status(500).json({ error: "Failed" });
  }
};
