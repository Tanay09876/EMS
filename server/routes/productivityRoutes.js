import { Router } from "express";
import {
  createProductivityTask,
  deleteProductivityTask,
  getAllProductivity,
  getProductivity,
  updateProductivityTask,
} from "../controllers/productivityController.js";
import { protect } from "../middleware/auth.js";

const productivityRouter = Router();

productivityRouter.get("/", protect, getProductivity);
productivityRouter.get("/admin/all", protect, getAllProductivity);
productivityRouter.post("/tasks", protect, createProductivityTask);
productivityRouter.patch("/tasks/:id", protect, updateProductivityTask);
productivityRouter.delete("/tasks/:id", protect, deleteProductivityTask);

export default productivityRouter;
