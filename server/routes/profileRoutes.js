import {Router} from "express"
import multer from "multer";
import {protect} from "../middleware/auth.js";
import {getProfile,updateProfile } from "../controllers/profileController.js";
import profileImageUpload from "../middleware/profileImageUpload.js";
const profileRouter = Router();
profileRouter.get('/',protect,getProfile)
profileRouter.post('/',protect,(req, res, next) => {
    profileImageUpload.single("profileImage")(req, res, (error) => {
        if(!error) return next();
        if(error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"){
            return res.status(400).json({ error: "Profile photo must be smaller than 4MB after cropping." });
        }
        return res.status(400).json({ error: error.message || "Could not upload profile photo." });
    });
},updateProfile)

export default profileRouter;
