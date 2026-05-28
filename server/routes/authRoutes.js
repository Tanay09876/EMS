import { Router } from "express";
import { changePassword, login, requestEmployeePasswordOtp, requestAdminPasswordOtp, resetAdminPasswordWithOtp, resetEmployeePasswordWithOtp, session } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";


const authRouter = Router();

authRouter.post("/login", login)
authRouter.get("/session", protect, session)
authRouter.post("/change-password", protect, changePassword)
authRouter.post("/forgot-password/employee/request-otp", requestEmployeePasswordOtp)
authRouter.post("/forgot-password/employee/reset", resetEmployeePasswordWithOtp)
authRouter.post("/forgot-password/admin/request-otp", requestAdminPasswordOtp)
authRouter.post("/forgot-password/admin/reset", resetAdminPasswordWithOtp)

export default authRouter;
