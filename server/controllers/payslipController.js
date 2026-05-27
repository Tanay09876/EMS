import Employee from "../models/Employee.js";
import Payslip from "../models/Payslip.js";
import { getLeaveBalance } from "../utils/leaveBalance.js";
import { getOrganizationSettings } from "../utils/organizationSettings.js";

// Create payslip
// POST /api/payslips
export const createPayslip = async (req, res) => {
    try {
        const { employeeId, month, year, basicSalary, allowances, deductions } = req.body;

        if (!employeeId || !month || !year || !basicSalary) {
            return res.status(400).json({ error: "Missing fields" });
        }

        const employee = await Employee.findOne({ _id: employeeId, isDeleted: { $ne: true } });
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const settings = await getOrganizationSettings();
        const leaveBalance = await getLeaveBalance(employee._id, Number(year));
        const annualBalance = leaveBalance.find((leave) => leave.type === "ANNUAL");
        const annualLeaveRemaining = Number(annualBalance?.remaining || 0);
        const annualLeavePayoutRate = Number(settings.annualLeavePayoutRate || 0);
        const annualLeavePayoutAmount = settings.annualLeavePayoutEnabled
            ? annualLeaveRemaining * annualLeavePayoutRate
            : 0;

        const netSalary =
            Number(basicSalary) +
            Number(allowances || 0) +
            annualLeavePayoutAmount -
            Number(deductions || 0);

        const payslip = await Payslip.create({
            employeeId,
            month: Number(month),
            year: Number(year),
            basicSalary: Number(basicSalary),
            allowances: Number(allowances || 0),
            deductions: Number(deductions || 0),
            annualLeavePayoutEnabled: Boolean(settings.annualLeavePayoutEnabled),
            annualLeaveRemaining,
            annualLeavePayoutRate,
            annualLeavePayoutAmount,
            currencyCode: settings.currencyCode || "INR",
            currencySymbol: settings.currencySymbol || "Rs",
            netSalary,
        });

        return res.json({ success: true, data: payslip });
    } catch (error) {
        console.error("createPayslip error:", error);
        return res.status(500).json({ error: "Failed to create payslip" });
    }
};

// Get payslips
// GET /api/payslips
export const getPayslips = async (req, res) => {
    try {
        const session = req.session;
        const isAdmin = session.role === "ADMIN";

        if (isAdmin) {
            const { search, department, period } = req.query;
            const periodParts = period ? String(period).split("-").map(Number) : [];
            const [month, year] = periodParts[0] > 12 ? [periodParts[1], periodParts[0]] : periodParts;
            const query = {};
            if (year && month) {
                query.year = year;
                query.month = month;
            }

            const payslips = await Payslip.find(query)
                .populate("employeeId")
                .sort({ createdAt: -1 });

            const term = search?.trim().toLowerCase();
            const data = payslips
                .map((p) => {
                    const obj = p.toObject();
                    return {
                    ...obj,
                    id: obj._id.toString(),
                    employee: obj.employeeId,
                    employeeId: obj.employeeId?._id?.toString(),
                    };
                })
                .filter((p) => {
                    const employee = p.employee || {};
                    const matchesDepartment = !department || department === "ALL" || employee.department === department;
                    const matchesSearch =
                        !term ||
                        `${employee.firstName || ""} ${employee.lastName || ""} ${employee.email || ""} ${employee.position || ""}`
                            .toLowerCase()
                            .includes(term);

                    return matchesDepartment && matchesSearch;
                });

            return res.json({ data });
        } else {
            const employee = await Employee.findOne({ userId: session.userId });
            if (!employee) return res.status(404).json({ error: "Employee not found" });

            const payslips = await Payslip.find({ employeeId: employee._id })
                .populate("employeeId")   // ✅ FIXED: populate so employee data is available
                .sort({ createdAt: -1 });

            // ✅ FIXED: consistent response shape with admin — always return { data: [] }
            const data = payslips.map((p) => {
                const obj = p.toObject();
                return {
                    ...obj,
                    id: obj._id.toString(),
                    employee: obj.employeeId,
                    employeeId: obj.employeeId?._id?.toString(),
                };
            });

            return res.json({ data });
        }
    } catch (error) {
        console.error("getPayslips error:", error);
        return res.status(500).json({ error: "Failed to fetch payslips" });
    }
};

// Get payslip by ID
// GET /api/payslips/:id
export const getPayslipById = async (req, res) => {
    try {
        const payslip = await Payslip.findById(req.params.id).populate("employeeId").lean();

        if (!payslip) return res.status(404).json({ error: "Payslip not found" });

        const result = {
            ...payslip,
            id: payslip._id.toString(),
            employee: payslip.employeeId,
        };

        return res.json(result);
    } catch (error) {
        console.error("getPayslipById error:", error);
        return res.status(500).json({ error: "Failed to fetch payslip" });
    }
};
