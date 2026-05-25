import cron from "node-cron";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import sendEmail from "../config/nodemailer.js";

// ─────────────────────────────────────────────
// 1. AUTO CHECK-OUT  (call this after check-in)
// ─────────────────────────────────────────────
export const scheduleAutoCheckOut = (employeeId, attendanceId) => {
  const NINE_HOURS = 9 * 60 * 60 * 1000;
  const ONE_HOUR = 1 * 60 * 60 * 1000;

  // export const scheduleAutoCheckOut = (employeeId, attendanceId) => {
  //   const NINE_HOURS = 10 * 1000;  // 10 seconds (was 9 * 60 * 60 * 1000)
  //   const ONE_HOUR   = 10 * 1000;  // 10 seconds (was 1 * 60 * 60 * 1000)

  // After 9 hours → send reminder email
  setTimeout(async () => {
    try {
      let attendance = await Attendance.findById(attendanceId);
      if (attendance?.checkOut) return; // already checked out, do nothing

      const employee = await Employee.findById(employeeId);

      await sendEmail({
        to: employee.email,
        subject: "Attendance Check-Out Reminder",
        body: `<div style="max-width: 600px;">
                    <h2>Hi ${employee.firstName}, 👋</h2>
                    <p style="font-size: 16px;">You have a check-in in ${employee.department} today:</p>
                    <p style="font-size: 18px; font-weight: bold; color: #007bff; margin: 8px 0;">${attendance?.checkIn?.toLocaleTimeString()}</p>
                    <p style="font-size: 16px;">Please make sure to check-out in one hour.</p>
                    <p style="font-size: 16px;">If you have any questions, please contact your admin.</p>
                    <br />
                    <p style="font-size: 16px;">Best Regards,</p>
                    <p style="font-size: 16px;">EMS</p>
                </div>`,
      });

      // After 1 more hour (10h total) → auto mark as Half Day
      setTimeout(async () => {
        try {
          attendance = await Attendance.findById(attendanceId);
          if (attendance?.checkOut) return; // checked out in the meantime

          attendance.checkOut =
            new Date(attendance.checkIn).getTime() + 4 * 60 * 60 * 1000;
          attendance.workingHours = 4;
          attendance.dayType = "Half Day";
          attendance.status = "LATE";
          await attendance.save();
        } catch (err) {
          console.error("Auto check-out (final) error:", err);
        }
      }, ONE_HOUR);
    } catch (err) {
      console.error("Auto check-out (reminder) error:", err);
    }
  }, NINE_HOURS);
};

// ─────────────────────────────────────────────
// 2. LEAVE APPLICATION REMINDER (call after creating a leave)
// ─────────────────────────────────────────────
export const scheduleLeaveReminder = (leaveApplicationId) => {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  // const TWENTY_FOUR_HOURS = 10 * 1000;  // 10 seconds (was 24 * 60 * 60 * 1000)

  setTimeout(async () => {
    try {
      const leaveApplication =
        await LeaveApplication.findById(leaveApplicationId);
      if (leaveApplication?.status !== "PENDING") return;

      const employee = await Employee.findById(leaveApplication.employeeId);

      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: "Leave Application Reminder",
        body: `<div style="max-width: 600px;">
    <h2>Hi Admin, 👋</h2>

    <p style="font-size: 16px;">
        A leave application is still pending your action.
    </p>

    <p style="font-size: 16px;">
        <strong>Employee:</strong>
        ${employee.firstName} ${employee.lastName} (${employee.department})
    </p>

    <p style="font-size: 16px;">
        <strong>Leave Type:</strong>
        ${
          leaveApplication.type === "HALF_DAY"
            ? `Half Day (${leaveApplication.halfDayPeriod === "FIRST" ? "Morning" : "Afternoon"})`
            : leaveApplication.type
        }
    </p>

    <p style="font-size: 16px;">
        <strong>Date:</strong>
        <span style="font-size: 18px; font-weight: bold; color: #007bff; margin: 8px 0;">
            ${leaveApplication.startDate?.toLocaleDateString()}
        </span>
    </p>

    <p style="font-size: 16px;">
        Please make sure to take action on this leave application.
    </p>

    <br />

    <p style="font-size: 16px;">Best Regards,</p>
    <p style="font-size: 16px;">EMS</p>
</div>`,
      });
    } catch (err) {
      console.error("Leave reminder error:", err);
    }
  }, TWENTY_FOUR_HOURS);
};

// ─────────────────────────────────────────────
// 3. ATTENDANCE REMINDER CRON  (runs at 11:30 AM IST daily)
// ─────────────────────────────────────────────
export const startAttendanceCron = () => {
  cron.schedule(
    "30 11 * * *",
    async () => {
      try {
        // Today's date range in IST
        const startUTC = new Date(
          new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) +
            "T00:00:00+05:30",
        );
        const endUTC = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000);

        // All active employees
        const activeEmployees = await Employee.find({
          isDeleted: false,
          employmentStatus: "ACTIVE",
        }).lean();

        // Employees on approved leave today
        const leaves = await LeaveApplication.find({
          status: "APPROVED",
          startDate: { $lte: endUTC },
          endDate: { $gte: startUTC },
        }).lean();
        const onLeaveIds = leaves.map((l) => l.employeeId.toString());

        // Employees already checked in
        const attendances = await Attendance.find({
          date: { $gte: startUTC, $lt: endUTC },
        }).lean();
        const checkedInIds = attendances.map((a) => a.employeeId.toString());

        // Absent = not on leave AND not checked in
        const absentEmployees = activeEmployees.filter(
          (emp) =>
            !onLeaveIds.includes(emp._id.toString()) &&
            !checkedInIds.includes(emp._id.toString()),
        );

        // Send emails
        await Promise.all(
          absentEmployees.map((emp) =>
            sendEmail({
              to: emp.email,
              subject: "Attendance Reminder — Please Mark Your Attendance",
              body: `<div style="max-width: 600px; font-family: Arial, sans-serif;">
                                <h2>Hi ${emp.firstName}, 👋</h2>
                                <p style="font-size: 16px;">We noticed you haven't marked your attendance yet today.</p>
                                <p style="font-size: 16px;">The deadline was <strong>11:30 AM</strong> and your attendance is still missing.</p>
                                <p style="font-size: 16px;">Please check in as soon as possible or contact your admin if you're facing any issues.</p>
                                <br />
                                <p style="font-size: 14px; color: #666;">Department: ${emp.department}</p>
                                <br />
                                <p style="font-size: 16px;">Best Regards,</p>
                                <p style="font-size: 16px;"><strong>QuickEMS</strong></p>
                            </div>`,
            }),
          ),
        );

        console.log(`Attendance cron done — absent: ${absentEmployees.length}`);
      } catch (err) {
        console.error("Attendance cron error:", err);
      }
    },
    { timezone: "Asia/Kolkata" },
  );
};
// export const startAttendanceCron = () => {
//   cron.schedule(
//     "* * * * *", 
//     async () => {
//       try {
//         const startUTC = new Date(
//           new Date().toLocaleDateString("en-CA", {
//             timeZone: "Asia/Kolkata",
//           }) + "T00:00:00+05:30",
//         );

//         const endUTC = new Date(
//           startUTC.getTime() + 24 * 60 * 60 * 1000,
//         );
//         const activeEmployees = await Employee.find({
//           isDeleted: false,
//           employmentStatus: "ACTIVE",
//         }).lean();

//         // Employees on approved leave today
//         const leaves = await LeaveApplication.find({
//           status: "APPROVED",
//           startDate: { $lte: endUTC },
//           endDate: { $gte: startUTC },
//         }).lean();

//         const onLeaveIds = leaves.map((l) =>
//           l.employeeId.toString(),
//         );

     

//         // Employees already checked in
//         const attendances = await Attendance.find({
//           date: { $gte: startUTC, $lt: endUTC },
//         }).lean();

//         const checkedInIds = attendances.map((a) =>
//           a.employeeId.toString(),
//         );

   

//         // Absent employees
//         const absentEmployees = activeEmployees.filter(
//           (emp) =>
//             !onLeaveIds.includes(emp._id.toString()) &&
//             !checkedInIds.includes(emp._id.toString()),
//         );

   

//         // Send emails
//         await Promise.all(
//           absentEmployees.map((emp) =>
//             sendEmail({
//               to: emp.email,
//               subject:
//                 "Attendance Reminder — Please Mark Your Attendance",
//             body: `<div style="max-width: 600px; font-family: Arial, sans-serif;">
//                                 <h2>Hi ${emp.firstName}, 👋</h2>
//                                 <p style="font-size: 16px;">We noticed you haven't marked your attendance yet today.</p>
//                                 <p style="font-size: 16px;">The deadline was <strong>11:30 AM</strong> and your attendance is still missing.</p>
//                                 <p style="font-size: 16px;">Please check in as soon as possible or contact your admin if you're facing any issues.</p>
//                                 <br />
//                                 <p style="font-size: 14px; color: #666;">Department: ${emp.department}</p>
//                                 <br />
//                                 <p style="font-size: 16px;">Best Regards,</p>
//                                 <p style="font-size: 16px;"><strong>QuickEMS</strong></p>
//                             </div>`,
              
//             }),
//           ),
//         );

//       } catch (err) {
//         console.error("Attendance cron error:", err);
//       }
//     },
//     {
//       timezone: "Asia/Kolkata",
//     },
//   );
// };