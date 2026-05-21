import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {type: String, required: true, unique: true },
    password: {type: String, required: true },
    role: {type: String, enum: ["ADMIN", "EMPLOYEE"], default: "EMPLOYEE"},
    firstName: {type: String, default: ""},
    lastName: {type: String, default: ""},
    bio: {type: String, default: ""},
    profileImage: {type: String, default: ""},
    isActive: {type: Boolean, default: true },   // ✅ ADD THIS
    resetOtp: {type: String, default: ""},
    resetOtpExpiresAt: {type: Date},
}, {timestamps: true})

const User = mongoose.models.User || mongoose.model("User", userSchema)

export default User;
