import Employee from "../models/Employee.js";
import User from "../models/User.js";
import cloudinary, { hasCloudinaryConfig } from "../config/cloudinary.js";

const uploadToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({
            folder: "employee_profiles",
            resource_type: "image",
            transformation: [
                { width: 420, height: 420, crop: "fill", gravity: "face" },
                { quality: "auto", fetch_format: "auto" },
            ],
        }, (error, result) => {
            if(error) return reject(error);
            resolve(result);
        });

        stream.end(file.buffer);
    });
};


// Get profile
// GET /api/profile
export const getProfile = async (req, res) => {
    try {
        const session = req.session;
        const employee = await Employee.findOne({userId: session.userId})

        if(!employee) {
            const user = await User.findById(session.userId).select("-password");
            return res.json({
                firstName: user?.firstName || "Admin",
                lastName: user?.lastName || "",
                email: session.email,
                position: session.role === "ADMIN" ? "Administrator" : "",
                role: session.role,
                bio: user?.bio || "",
                profileImage: user?.profileImage || "",
            })
        }
        return res.json(employee)
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch profile" });
    }
}

// Update profile
// PUT /api/profile
export const updateProfile = async (req, res) => {
    try {
        const session = req.session;
        const employee = await Employee.findOne({userId: session.userId})
        const isAdminProfile = !employee && session.role === "ADMIN";
        if(!employee && !isAdminProfile) return res.status(404).json({ error: "Employee not found" });
        if (employee?.isDeleted){
            return res.status(403).json({error: "Your account is deactivated. You cannot update your profile.",})
        }
        const update = {}

        if(req.body.bio !== undefined){
            update.bio = req.body.bio
        }

        if(req.body.removeProfileImage === "true"){
            update.profileImage = "";
        }

        if(req.file){
            if(!hasCloudinaryConfig()){
                return res.status(500).json({ error: "Cloudinary credentials are missing in server .env file." });
            }

            const uploadedImage = await uploadToCloudinary(req.file);
            if(!uploadedImage?.secure_url){
                return res.status(500).json({ error: "Cloudinary upload did not return an image URL." });
            }

            update.profileImage = uploadedImage.secure_url;
        }

        if(isAdminProfile){
            const updatedUser = await User.findByIdAndUpdate(session.userId, update, {returnDocument: "after"})
            return res.json({ success: true, profileImage: updatedUser.profileImage });
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(employee._id, update, {returnDocument: "after"})
        
        // Synchronize changes to User schema for data consistency
        const userUpdate = {};
        if (update.bio !== undefined) userUpdate.bio = update.bio;
        if (update.profileImage !== undefined) userUpdate.profileImage = update.profileImage;
        if (Object.keys(userUpdate).length > 0) {
            await User.findByIdAndUpdate(employee.userId, userUpdate);
        }

        return res.json({ success: true, profileImage: updatedEmployee.profileImage });
    } catch (error) {
        console.error(error);
        const message = error?.message || "Failed to update profile";
        return res.status(500).json({ error: message });
    }
}
