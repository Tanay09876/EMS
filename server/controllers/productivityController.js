import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import ProductivityTask from "../models/ProductivityTask.js";
import { getLeaveBalance } from "../utils/leaveBalance.js";

const startOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getTaskDateRange = (query) => {
  const selectedDate = startOfDay(query.date || new Date());
  return {
    selectedDate,
    weekStart: addDays(selectedDate, -6),
    weekEnd: endOfDay(selectedDate),
  };
};

const resolveEmployee = async (session, requestedEmployeeId) => {
  if (session.role === "ADMIN" && requestedEmployeeId) {
    return Employee.findOne({ _id: requestedEmployeeId, isDeleted: { $ne: true } });
  }

  return Employee.findOne({ userId: session.userId, isDeleted: { $ne: true } });
};

const normalizeTask = (task) => ({
  ...task,
  id: task._id.toString(),
});

export const getProductivity = async (req, res) => {
  try {
    const employee = await resolveEmployee(req.session, req.query.employeeId);
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const { selectedDate, weekStart, weekEnd } = getTaskDateRange(req.query);
    const [tasks, attendance, leaveBalance] = await Promise.all([
      ProductivityTask.find({
        employeeId: employee._id,
        date: { $gte: weekStart, $lte: weekEnd },
      })
        .sort({ date: -1, createdAt: -1 })
        .lean(),
      Attendance.find({
        employeeId: employee._id,
        date: { $gte: weekStart, $lte: weekEnd },
      }).lean(),
      getLeaveBalance(employee._id, selectedDate.getFullYear()),
    ]);

    const todayTasks = tasks.filter(
      (task) => startOfDay(task.date).getTime() === selectedDate.getTime(),
    );
    const completedTasks = todayTasks.filter((task) => task.status === "COMPLETED");
    const completionPercentage = todayTasks.length
      ? Math.round((completedTasks.length / todayTasks.length) * 100)
      : 0;

    const totalActualHours = todayTasks.reduce(
      (sum, task) => sum + (Number(task.actualHours) || 0),
      0,
    );
    const attendanceHours = attendance.reduce(
      (sum, record) => sum + (Number(record.workingHours) || 0),
      0,
    );

    const weeklyGraph = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);
      const dayTasks = tasks.filter(
        (task) => startOfDay(task.date).getTime() === date.getTime(),
      );
      const completed = dayTasks.filter((task) => task.status === "COMPLETED").length;
      const dayAttendanceHours = attendance
        .filter((record) => startOfDay(record.date).getTime() === date.getTime())
        .reduce((sum, record) => sum + (Number(record.workingHours) || 0), 0);

      return {
        date,
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        totalTasks: dayTasks.length,
        completedTasks: completed,
        completionPercentage: dayTasks.length ? Math.round((completed / dayTasks.length) * 100) : 0,
        workHours: Number(dayAttendanceHours.toFixed(2)),
      };
    });

    return res.json({
      employee: {
        id: employee._id.toString(),
        firstName: employee.firstName,
        lastName: employee.lastName,
        position: employee.position,
        department: employee.department,
        isDeleted: employee.isDeleted,
      },
      selectedDate,
      tasks: tasks.map(normalizeTask),
      todayTasks: todayTasks.map(normalizeTask),
      summary: {
        totalTasks: todayTasks.length,
        completedTasks: completedTasks.length,
        completionPercentage,
        totalActualHours: Number(totalActualHours.toFixed(2)),
        weeklyAttendanceHours: Number(attendanceHours.toFixed(2)),
      },
      weeklyGraph,
      leaveBalance,
    });
  } catch (error) {
    console.error("Productivity fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch productivity data" });
  }
};

export const getAllProductivity = async (req, res) => {
  try {
    if (req.session.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { selectedDate, weekStart, weekEnd } = getTaskDateRange(req.query);
    const employees = await Employee.find({ isDeleted: { $ne: true } })
      .sort({ firstName: 1, lastName: 1 })
      .lean();
    const employeeIds = employees.map((employee) => employee._id);

    const [tasks, attendance] = await Promise.all([
      ProductivityTask.find({
        employeeId: { $in: employeeIds },
        date: { $gte: weekStart, $lte: weekEnd },
      }).lean(),
      Attendance.find({
        employeeId: { $in: employeeIds },
        date: { $gte: weekStart, $lte: weekEnd },
      }).lean(),
    ]);

    const employeeRows = employees.map((employee) => {
      const id = employee._id.toString();
      const todayTasks = tasks.filter(
        (task) =>
          task.employeeId.toString() === id &&
          startOfDay(task.date).getTime() === selectedDate.getTime(),
      );
      const weekTasks = tasks.filter((task) => task.employeeId.toString() === id);
      const completedToday = todayTasks.filter((task) => task.status === "COMPLETED").length;
      const completedWeek = weekTasks.filter((task) => task.status === "COMPLETED").length;
      const weeklyHours = attendance
        .filter((record) => record.employeeId.toString() === id)
        .reduce((sum, record) => sum + (Number(record.workingHours) || 0), 0);

      return {
        employee: {
          id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          department: employee.department,
          position: employee.position,
        },
        todayTasks: todayTasks.length,
        completedToday,
        completionPercentage: todayTasks.length
          ? Math.round((completedToday / todayTasks.length) * 100)
          : 0,
        weekTasks: weekTasks.length,
        completedWeek,
        weeklyHours: Number(weeklyHours.toFixed(2)),
      };
    });

    const totals = employeeRows.reduce(
      (acc, row) => {
        acc.todayTasks += row.todayTasks;
        acc.completedToday += row.completedToday;
        acc.weekTasks += row.weekTasks;
        acc.completedWeek += row.completedWeek;
        acc.weeklyHours += row.weeklyHours;
        return acc;
      },
      { todayTasks: 0, completedToday: 0, weekTasks: 0, completedWeek: 0, weeklyHours: 0 },
    );

    return res.json({
      selectedDate,
      employees: employeeRows,
      summary: {
        ...totals,
        weeklyHours: Number(totals.weeklyHours.toFixed(2)),
        completionPercentage: totals.todayTasks
          ? Math.round((totals.completedToday / totals.todayTasks) * 100)
          : 0,
      },
    });
  } catch (error) {
    console.error("All productivity fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch team productivity" });
  }
};

export const createProductivityTask = async (req, res) => {
  try {
    const employee = await resolveEmployee(req.session, req.body.employeeId);
    if (!employee) return res.status(404).json({ error: "Employee not found" });
    if (employee.isDeleted) {
      return res.status(403).json({ error: "Employee account is deactivated" });
    }

    const { title, description, date, estimatedHours, actualHours, status } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "Task title is required" });

    const task = await ProductivityTask.create({
      employeeId: employee._id,
      title: title.trim(),
      description: description || "",
      date: startOfDay(date || new Date()),
      estimatedHours: Number(estimatedHours) || 0,
      actualHours: Number(actualHours) || 0,
      status: status || "TODO",
    });

    return res.status(201).json({ success: true, data: normalizeTask(task.toObject()) });
  } catch (error) {
    console.error("Productivity create error:", error);
    return res.status(500).json({ error: "Failed to create task" });
  }
};

export const updateProductivityTask = async (req, res) => {
  try {
    const task = await ProductivityTask.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const employee = await resolveEmployee(req.session, req.body.employeeId);
    if (!employee) return res.status(404).json({ error: "Employee not found" });
    if (task.employeeId.toString() !== employee._id.toString()) {
      return res.status(403).json({ error: "You cannot update this task" });
    }

    const allowed = ["title", "description", "estimatedHours", "actualHours", "status"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });
    if (req.body.date) task.date = startOfDay(req.body.date);

    await task.save();
    return res.json({ success: true, data: normalizeTask(task.toObject()) });
  } catch (error) {
    console.error("Productivity update error:", error);
    return res.status(500).json({ error: "Failed to update task" });
  }
};

export const deleteProductivityTask = async (req, res) => {
  try {
    const task = await ProductivityTask.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const employee = await resolveEmployee(req.session, req.query.employeeId);
    if (!employee) return res.status(404).json({ error: "Employee not found" });
    if (task.employeeId.toString() !== employee._id.toString()) {
      return res.status(403).json({ error: "You cannot delete this task" });
    }

    await task.deleteOne();
    return res.json({ success: true });
  } catch (error) {
    console.error("Productivity delete error:", error);
    return res.status(500).json({ error: "Failed to delete task" });
  }
};
