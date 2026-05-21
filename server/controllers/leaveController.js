import { inngest } from "../inngest/index.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import sendEmail from "../config/nodemailer.js";
import { leaveDecisionEmail } from "../utils/emailTemplates.js";

const getTotalDays = (startDate, endDate) => {
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
        const employee = await Employee.findOne({userId: session.userId})
        if(!employee) return res.status(404).json({ error: "Employee not found" });
        if(employee.isDeleted){
            return res.status(403).json({
                 error: "Your account is deactivated. You cannot apply for leave.",
            })
        }

        const { type, startDate, endDate, reason } = req.body;

        if(!type || !startDate || !endDate || !reason){
            return res.status(400).json({ error: "Missing fields" });
        }

        const today = new Date();
        today.setHours(0,0,0,0);
        if(new Date(startDate) <= today || new Date(endDate) <= today){
            return res.status(400).json({ error: "Leave dates must be in the future" });
        }

        if(new Date(endDate) < new Date(startDate) ){
            return res.status(400).json({ error: "End date cannot be before start date" });
        }


        const leave = await LeaveApplication.create({
            employeeId: employee._id,
            type,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason,
            status: "PENDING",
        })

        await inngest.send({
            name: "leave/pending",
            data: {leaveApplicationId: leave._id,}
        })

        return res.json({ success: true, data: leave });
        
    } catch (error) {
        return res.status(500).json({ error: "Failed" });
    }
}

// Get leaves
// GET /api/leaves
export const getLeaves = async (req, res) => {
    try {
        const session = req.session;
        const isAdmin = session.role === "ADMIN";
        if(isAdmin){
            const status = req.query.status;
            const where = status ? {status} : {};
            const leaves = await LeaveApplication.find(where).populate("employeeId").sort({ createdAt: -1 });
            const data = leaves.map((l)=>{
                const obj = l.toObject();
                return {
                    ...obj,
                    id: obj._id.toString(),
                    employee: obj.employeeId,
                    employeeId: obj.employeeId?._id?.toString(),
                }
            })
            return res.json({data})
        } else{
            const employee = await Employee.findOne({
                userId: session.userId,
            }).lean();
            if(!employee) return res.status(404).json({ error: "Not found" });
            const leaves = await LeaveApplication.find({
                employeeId: employee._id
            }).sort({ createdAt: -1 });
            return res.json({
                data: leaves,
                employee: {...employee, id: employee._id.toString()}
            })
        }
    } catch (error) {
      return res.status(500).json({ error: "Failed" });  
    }
}

// Update leave status
// PATCH /api/leaves/:id
export const updateLeaveStatus = async (req, res) => {
    try {
        const { status, adminRemark } = req.body;
        if(!["APPROVED", "REJECTED", "PENDING"].includes(status)){
            return res.status(400).json({ error: "Invalid status" });
        }
        if(status === "REJECTED" && !adminRemark?.trim()){
            return res.status(400).json({ error: "Rejection reason is required" });
        }

        const existingLeave = await LeaveApplication.findById(req.params.id).populate("employeeId");
        if(!existingLeave) return res.status(404).json({ error: "Leave application not found" });

        const totalDays = getTotalDays(existingLeave.startDate, existingLeave.endDate);
        const leave = await LeaveApplication.findByIdAndUpdate(req.params.id, {
            status,
            adminRemark: adminRemark || "",
            totalDays,
            respondedAt: new Date(),
        }, {returnDocument: "after"}).populate("employeeId")

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
            }),
        }).catch((mailError)=> console.error("Leave decision email error:", mailError));

        return res.json({success: true, data: leave})
    } catch (error) {
        console.error("Leave status error:", error);
        return res.status(500).json({ error: "Failed" });
    }
}
