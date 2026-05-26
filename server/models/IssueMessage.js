import mongoose from "mongoose";

const issueMessageSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["OPEN", "IN_REVIEW", "RESOLVED"],
      default: "OPEN",
    },
    adminReply: { type: String, default: "", trim: true },
    respondedAt: { type: Date },
  },
  { timestamps: true },
);

issueMessageSchema.index({ employeeId: 1, createdAt: -1 });
issueMessageSchema.index({ status: 1, createdAt: -1 });

const IssueMessage =
  mongoose.models.IssueMessage ||
  mongoose.model("IssueMessage", issueMessageSchema);

export default IssueMessage;
