import express from "express";
import cors from "cors";
import "dotenv/config";
import multer from "multer";

import connectDB from "./config/db.js";

import authRouter from "./routes/authRoutes.js";
import employeesRouter from "./routes/employeeRoutes.js";
import profileRouter from "./routes/profileRoutes.js";
import attendanceRouter from "./routes/attendanceRoutes.js";
import leaveRouter from "./routes/leaveRoutes.js";
import payslipRouter from "./routes/payslipsRoutes.js";
import dashboardRouter from "./routes/dashboardRoutes.js";
import productivityRouter from "./routes/productivityRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { startAttendanceCron } from "./jobs/functions.js";
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
const parseTextFormData = multer().none();
app.use((req, res, next) => {
  if (req.path === "/api/profile" || req.path.startsWith("/api/profile/")) {
    return next();
  }

  return parseTextFormData(req, res, next);
});


// CONNECT DATABASE FIRST
await connectDB();

startAttendanceCron()
// Routes
app.get("/", (req, res) => res.send("Server is running"));
app.use("/api/auth", authRouter);
app.use("/api/employees", employeesRouter);
app.use("/api/profile", profileRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/leave", leaveRouter);
app.use("/api/payslips", payslipRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/productivity", productivityRouter);
app.use("/api/messages", messageRouter);



// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
