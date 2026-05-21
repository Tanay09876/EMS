// import { Router } from "express";
// import { createEmployee, deleteEmployee, getEmployees, updateEmployee} from "../controllers/employeeController.js";
// import { protect, protectAdmin } from "../middleware/auth.js";

// const employeesRouter = Router();

// employeesRouter.get("/", protect, protectAdmin, getEmployees)
// employeesRouter.post("/", protect, protectAdmin, createEmployee)
// employeesRouter.put("/:id", protect, protectAdmin, updateEmployee)
// employeesRouter.delete("/:id", protect, protectAdmin, deleteEmployee)

// export default employeesRouter;

import express from "express";
import {
  getEmployees,
  getDeletedEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  recoverEmployee,
} from "../controllers/employeeController.js";
import { protect, protectAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getEmployees);
router.get("/deleted", protect, protectAdmin, getDeletedEmployees);
router.post("/", protect, protectAdmin, createEmployee);
router.put("/:id", protect, protectAdmin, updateEmployee);
router.delete("/:id", protect, protectAdmin, deleteEmployee);
router.patch("/:id/recover", protect, protectAdmin, recoverEmployee);

export default router;