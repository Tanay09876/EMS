import mongoose from "mongoose";

const leaveApplicationSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    type: { type: String, enum: ["SICK", "CASUAL", "ANNUAL", "HALF_DAY"], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    halfDayPeriod: { type: String, enum: ["FIRST", "SECOND"], default: null }, // add this
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    adminRemark: { type: String, default: "" },
    totalDays: { type: Number, default: 0 },
    respondedAt: { type: Date },
}, { timestamps: true })

const LeaveApplication = mongoose.models.LeaveApplication || mongoose.model("LeaveApplication", leaveApplicationSchema);

export default LeaveApplication;