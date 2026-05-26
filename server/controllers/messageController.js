import Employee from "../models/Employee.js";
import IssueMessage from "../models/IssueMessage.js";

const normalizeMessage = (message) => {
  const obj = message.toObject ? message.toObject() : message;
  return {
    ...obj,
    id: obj._id.toString(),
    employeeId: obj.employeeId?._id?.toString?.() || obj.employeeId?.toString?.(),
    employee: obj.employeeId?._id
      ? {
          id: obj.employeeId._id.toString(),
          firstName: obj.employeeId.firstName,
          lastName: obj.employeeId.lastName,
          department: obj.employeeId.department,
          position: obj.employeeId.position,
        }
      : undefined,
  };
};

export const getMessages = async (req, res) => {
  try {
    const isAdmin = req.session.role === "ADMIN";
    const query = {};

    if (!isAdmin) {
      const employee = await Employee.findOne({ userId: req.session.userId }).lean();
      if (!employee) return res.status(404).json({ error: "Employee not found" });
      query.employeeId = employee._id;
    }

    const messages = await IssueMessage.find(query)
      .populate("employeeId")
      .sort({ createdAt: -1 });

    return res.json({ data: messages.map(normalizeMessage) });
  } catch (error) {
    console.error("Messages fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
};

export const createMessage = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.session.userId });
    if (!employee) return res.status(404).json({ error: "Employee not found" });
    if (employee.isDeleted) return res.status(403).json({ error: "Employee account is deactivated" });

    const { subject, message } = req.body;
    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({ error: "Subject and message are required" });
    }

    const issue = await IssueMessage.create({
      employeeId: employee._id,
      subject: subject.trim(),
      message: message.trim(),
    });

    return res.status(201).json({ success: true, data: normalizeMessage(issue) });
  } catch (error) {
    console.error("Message create error:", error);
    return res.status(500).json({ error: "Failed to submit issue" });
  }
};

export const updateMessage = async (req, res) => {
  try {
    if (req.session.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { status, adminReply } = req.body;
    if (status && !["OPEN", "IN_REVIEW", "RESOLVED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const issue = await IssueMessage.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: "Message not found" });

    if (status) issue.status = status;
    if (adminReply !== undefined) issue.adminReply = adminReply;
    issue.respondedAt = new Date();

    await issue.save();
    await issue.populate("employeeId");

    return res.json({ success: true, data: normalizeMessage(issue) });
  } catch (error) {
    console.error("Message update error:", error);
    return res.status(500).json({ error: "Failed to update message" });
  }
};
