import mongoose from "mongoose";

const payslipSchema = new mongoose.Schema({
    employeeId: {type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true},
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    basicSalary: { type: Number, required: true },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    annualLeavePayoutEnabled: { type: Boolean, default: false },
    annualLeaveRemaining: { type: Number, default: 0 },
    annualLeavePayoutRate: { type: Number, default: 0 },
    annualLeavePayoutAmount: { type: Number, default: 0 },
    currencyCode: { type: String, default: "INR" },
    currencySymbol: { type: String, default: "Rs" },
    netSalary: { type: Number, required: true },

}, {timestamps: true})

const Payslip = mongoose.models.Payslip || mongoose.model("Payslip", payslipSchema)

export default Payslip;
