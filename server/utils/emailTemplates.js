// export const formatDate = (date) => new Date(date).toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
// });

// export const accountCreatedEmail = ({name, email, password, role}) => `
//     <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
//         <h2>Welcome to Employee MS</h2>
//         <p>Hello ${name},</p>
//         <p>Your ${role === "ADMIN" ? "admin" : "employee"} account has been created.</p>
//         <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
//             <p><strong>Login Email:</strong> ${email}</p>
//             <p><strong>Temporary Password:</strong> ${password}</p>
//         </div>
//         <p>Please sign in and change your password from Settings.</p>
//     </div>
// `;

// export const resetOtpEmail = ({otp}) => `
//     <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
//         <h2>Password reset OTP</h2>
//         <p>Use this OTP to reset your Employee MS password.</p>
//         <p style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</p>
//         <p>This OTP expires in 10 minutes.</p>
//     </div>
// `;

// export const leaveDecisionEmail = ({name, status, type, startDate, endDate, totalDays, reason, adminRemark}) => `
//     <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
//         <h2>Leave ${status === "APPROVED" ? "Approved" : "Rejected"}</h2>
//         <p>Hello ${name},</p>
//         <p>Your leave request has been <strong>${status.toLowerCase()}</strong>.</p>
//         <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
//             <p><strong>Type:</strong> ${type}</p>
//             <p><strong>Date:</strong> ${formatDate(startDate)} to ${formatDate(endDate)}</p>
//             <p><strong>Total Days:</strong> ${totalDays}</p>
//             <p><strong>Your Reason:</strong> ${reason}</p>
//             ${adminRemark ? `<p><strong>Admin Remark:</strong> ${adminRemark}</p>` : ""}
//         </div>
//     </div>
// `;


export const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

const LOGO_URL = `${process.env.SERVER_URL}/favicon.svg`;


// ===============================
// COMMON EMAIL LAYOUT
// ===============================
const emailLayout = (title, content) => `
    <div style=" background:#f1f5f9;  padding:40px 20px; font-family:Arial,sans-serif; color:#1e293b;">
        <div style=" max-width:600px; margin:auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.08);">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:30px;text-align:center;">
                <img src="${LOGO_URL}" alt="EMS Logo" style=" width:70px; height:70px; object-fit:contain; margin-bottom:12px;"/>
                <h1 style="color:white; margin:0;font-size:28px; font-weight:700; text-align:center;">
                    EMS
                </h1>
                <p style=" color:#dbeafe;  margin-top:8px;font-size:14px; ">
                    Smart Employee Management System
                </p>
            </div>

            <!-- Body -->
            <div style="padding:35px;">
                <h2 style="margin-top:0;color:#0f172a;font-size:24px;">
                    ${title}
                </h2>
                ${content}
            </div>

            <!-- Footer -->
            <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px; text-align:center;font-size:13px; color:#64748b; ">
                © ${new Date().getFullYear()}EMS <br/>
                Secure HR & Employee Management Platform
            </div>

        </div>
    </div>
`;


// ===============================
// ACCOUNT CREATED EMAIL
// ===============================
export const accountCreatedEmail = ({
    name,
    email,
    password,
    role,
}) =>
    emailLayout(
        "Welcome to EMS 🎉",

        `
        <p>Hello <strong>${name}</strong>,</p>

        <p>
            Your ${
                role === "ADMIN"
                    ? "administrator"
                    : "employee"
            } account has been successfully created.
        </p>

        <div style="background:#f8fafc;border:1px solid #e2e8f0; border-radius:12px;padding:20px;margin:24px 0;">
            <p style="margin:10px 0;">
                <strong>Login Email:</strong><br/>
                ${email}
            </p>
            <p style="margin:10px 0;">
                <strong>Temporary Password:</strong><br/>
                ${password}
            </p>
            <p style="margin:10px 0;">
                <strong>Role:</strong><br/>
                ${role}
            </p>
        </div>
        <p>
            For security reasons, please change your password after logging in.
        </p>
        <div style="margin-top:30px;">
            <a href="${process.env.CLIENT_URL}" 
            style=" background:#2563eb; color:white; text-decoration:none; padding:14px 24px;border-radius:10px;display:inline-block;font-weight:600;">
                Login Now
            </a>
        </div>
        `
    );


// ===============================
// RESET OTP EMAIL
// ===============================
export const resetOtpEmail = ({ otp }) =>
    emailLayout(
        "Password Reset OTP 🔐",
        `
        <p>
            We received a request to reset your EMS account password.
        </p>

        <p>
            Use the following OTP to continue:
        </p>

        <div style="background:#eff6ff; border:2px dashed #2563eb; border-radius:12px; padding:20px; text-align:center;margin:30px 0; ">
            <div style=" font-size:36px;font-weight:700; color:#2563eb;letter-spacing:8px;">
                ${otp}
            </div>
        </div>

        <p>
            This OTP will expire in <strong>10 minutes</strong>.
        </p>

        <p style="color:#ef4444;">
            If you did not request this, please ignore this email.
        </p>
        `
    );


// ===============================
// LEAVE DECISION EMAIL
// ===============================
// REMOVE the old leaveDecisionEmail entirely and REPLACE with this one

export const leaveDecisionEmail = ({
    name, status, type, startDate, endDate, totalDays, reason, adminRemark, halfDayPeriod,
}) => {
    const leaveTypeLabel = type === "HALF_DAY"
        ? `Half Day (${halfDayPeriod === "FIRST" ? "Morning" : "Afternoon"})`
        : type.charAt(0) + type.slice(1).toLowerCase() + " Leave";

    const durationBlock = type === "HALF_DAY"
        ? `<p><strong>Date:</strong><br/>${formatDate(startDate)}</p>
           <p><strong>Total Days:</strong><br/>0.5</p>`
        : `<p><strong>Duration:</strong><br/>${formatDate(startDate)} → ${formatDate(endDate)}</p>
           <p><strong>Total Days:</strong><br/>${totalDays}</p>`;

    return emailLayout(
        `Leave ${status === "APPROVED" ? "Approved " : "Rejected "}`,
        `
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your leave request has been
            <strong style="color:${status === "APPROVED" ? "#16a34a" : "#dc2626"};">
                ${status.toLowerCase()}
            </strong>.
        </p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:24px 0;">
            <p><strong>Leave Type:</strong><br/>${leaveTypeLabel}</p>
            ${durationBlock}
            <p><strong>Your Reason:</strong><br/>${reason}</p>
            ${adminRemark ? `<p><strong>Admin Remark:</strong><br/>${adminRemark}</p>` : ""}
        </div>
        ${status === "APPROVED"
            ? `<p style="color:#16a34a;">Please ensure proper handover of your work before leave.</p>`
            : `<p style="color:#dc2626;">Please contact your administrator for further clarification.</p>`
        }
        `
    );
};