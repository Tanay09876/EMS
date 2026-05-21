import multer from "multer";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

const profileImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Profile photo must be a JPG, PNG, or WebP image."));
    }

    cb(null, true);
  },
});

export default profileImageUpload;
