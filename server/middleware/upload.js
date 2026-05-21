import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({

    cloudinary,

    params: {
        folder: "employee_profiles",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
    },
});

const upload = multer({

    storage,

    limits: {
        fileSize: 2 * 1024 * 1024,
    },
});

export default upload;