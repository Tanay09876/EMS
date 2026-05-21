import User from "../models/User.js";
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import sendEmail from "../config/nodemailer.js";
import { resetOtpEmail } from "../utils/emailTemplates.js";

// Login for employee and admin
// POST /api/auth/login
export const login = async (req, res) => {
    try {
        const {email, password, role_type} = req.body;

        if(!email || !password){
            return res.status(400).json({ error: "Email and password are required" });
        }

const user = await User.findOne({ email })
if(!user) {
    return res.status(401).json({ error: "Invalid credentials" });
}

if(!user.isActive) {
    return res.status(401).json({ error: "Account is deactivated" });
}

        if(role_type === "admin" && user.role !== "ADMIN"){
            return res.status(401).json({ error: "Not authorized as admin" });
        }

        if(role_type === "employee" && user.role !== "EMPLOYEE"){
            return res.status(401).json({ error: "Not authorized as employee" });
        }

        const isValid = await bcrypt.compare(password, user.password)
        if(!isValid){
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const payload = {
            userId: user._id.toString(),
            role: user.role,
            email: user.email,
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "7d"});

        return res.json({ user: payload, token });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ error: "Login failed" });
    }
}

// Get session for employee and admin
// GET /api/auth/session
export const session = (req, res)=>{
    const session = req.session;
    return res.json({user: session})
}

// Change password for employee and admin
// POST /api/auth/change-password
export const changePassword = async (req, res) => {
    try {
        const session = req.session;
        const { currentPassword, newPassword } = req.body;
        if(!currentPassword || !newPassword){
            return res.status(400).json({ error: "Both passwords are required" });
        }
        const user = await User.findById(session.userId)
        if(!user) return res.status(404).json({ error: "User not found" });
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if(!isValid) return res.status(400).json({ error: "Current password is incorrect" });
        const hashed = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(session.userId, {password: hashed})
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: "Failed to change password" });
    }
}

export const requestEmployeePasswordOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if(!email) return res.status(400).json({ error: "Email is required" });

        const user = await User.findOne({email, role: "EMPLOYEE"});
        if(!user) return res.status(404).json({ error: "Employee account not found" });

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.resetOtp = await bcrypt.hash(otp, 10);
        user.resetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendEmail({
            to: email,
            subject: "Employee MS password reset OTP",
            body: resetOtpEmail({otp}),
        });

        return res.json({ success: true });
    } catch (error) {
        console.error("OTP request error:", error);
        if(error?.code === "EAUTH"){
            return res.status(500).json({ error: "SMTP authentication failed. Check SMTP_USER and SMTP_PASS in server .env." });
        }
        return res.status(500).json({ error: "Failed to send OTP" });
    }
}

export const resetEmployeePasswordWithOtp = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if(!email || !otp || !newPassword){
            return res.status(400).json({ error: "Email, OTP, and new password are required" });
        }
        if(newPassword.length < 6){
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        const user = await User.findOne({email, role: "EMPLOYEE"});
        if(!user || !user.resetOtp || !user.resetOtpExpiresAt){
            return res.status(400).json({ error: "Please request a new OTP" });
        }
        if(user.resetOtpExpiresAt < new Date()){
            return res.status(400).json({ error: "OTP expired. Please request a new OTP" });
        }

        const isValidOtp = await bcrypt.compare(otp, user.resetOtp);
        if(!isValidOtp) return res.status(400).json({ error: "Invalid OTP" });

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetOtp = "";
        user.resetOtpExpiresAt = undefined;
        await user.save();

        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: "Failed to reset password" });
    }
}

export const resetAdminPasswordDirect = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        if(!email || !newPassword){
            return res.status(400).json({ error: "Email and new password are required" });
        }
        if(newPassword.length < 6){
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        const user = await User.findOne({email, role: "ADMIN"});
        if(!user) return res.status(404).json({ error: "Admin account not found" });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: "Failed to reset admin password" });
    }
}



