import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { protect, protectAdmin } from "../middleware/auth.js";

const settingsRouter = Router();

settingsRouter.get("/", protect, getSettings);
settingsRouter.put("/", protect, protectAdmin, updateSettings);

export default settingsRouter;
