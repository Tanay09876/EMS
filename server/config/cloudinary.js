import { v2 as cloudinary } from "cloudinary";

const getCloudinaryConfig = () => {
    if(process.env.CLOUDINARY_URL){
        const cloudinaryUrl = new URL(process.env.CLOUDINARY_URL);
        return {
            cloud_name: cloudinaryUrl.hostname,
            api_key: decodeURIComponent(cloudinaryUrl.username),
            api_secret: decodeURIComponent(cloudinaryUrl.password),
        };
    }

    return {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    };
};

export const hasCloudinaryConfig = () => {
    const config = getCloudinaryConfig();
    return Boolean(config.cloud_name && config.api_key && config.api_secret);
};

cloudinary.config(getCloudinaryConfig());

export default cloudinary;
