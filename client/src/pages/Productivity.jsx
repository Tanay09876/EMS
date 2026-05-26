import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3Icon,
  BellIcon,
  BriefcaseBusinessIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import api from "../api/axios";
import Loading from "../components/Loading";
import { useAuth } from "../context/AuthContext";

const statusOptions = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
];

const defaultForm = {
  title: "",
  description: "",
  estimatedHours: 1,
  actualHours: 0,
  status: "TODO",
};

const statusClass = {
  TODO: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200",
  IN_PROGRESS: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-600/10",
  COMPLETED: "badge-success",
};

const Productivity = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [data, setData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [form, setForm] = useState(defaultForm);
  const [notificationFilter, setNotificationFilter] = useState("TODO");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchEmployees = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get("/employees");
      const list = res.data || [];
      setEmployees(list);
      if (!selectedEmployeeId && list[0]?.id) setSelectedEmployeeId(list[0].id);
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message);
    }
  }, [isAdmin, selectedEmployeeId]);

  const fetchProductivity = useCallback(async () => {
    if (isAdmin && !selectedEmployeeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = { date: selectedDate };
      if (selectedEmployeeId) params.employeeId = selectedEmployeeId;
      const res = await api.get("/productivity", { params });
      setData(res.data);
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, selectedDate, selectedEmployeeId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProductivity();
  }, [fetchProductivity]);

  const maxGraphValue = useMemo(() => {
    const values = data?.weeklyGraph?.map((item) => Math.max(item.completionPercentage, item.workHours * 10)) || [];
    return Math.max(...values, 100);
  }, [data]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTask = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    try {
      setSaving(true);
      await api.post("/productivity/tasks", {
        ...form,
        date: selectedDate,
        employeeId: selectedEmployeeId,
      });
      setForm(defaultForm);
      toast.success("Task added");
      fetchProductivity();
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message);
    } finally {
      setSaving(false);
    }
  };

  const updateTask = async (task, updates) => {
    try {
      await api.patch(`/productivity/tasks/${task.id || task._id}`, {
        ...updates,
        employeeId: selectedEmployeeId,
      });
      fetchProductivity();
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message);
    }
  };

  const deleteTask = async (task) => {
    try {
      await api.delete(`/productivity/tasks/${task.id || task._id}`, {
        params: selectedEmployeeId ? { employeeId: selectedEmployeeId } : {},
      });
      toast.success("Task deleted");
      fetchProductivity();
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message);
    }
  };

  if (loading && !data) return <Loading />;

  const summaryCards = [
    {
      label: "Completion",
      value: `${data?.summary?.completionPercentage || 0}%`,
      icon: CheckCircle2Icon,
    },
    {
      label: "Daily Tasks",
      value: `${data?.summary?.completedTasks || 0}/${data?.summary?.totalTasks || 0}`,
      icon: BriefcaseBusinessIcon,
    },
    {
      label: "Task Hours",
      value: `${data?.summary?.totalActualHours || 0}h`,
      icon: ClockIcon,
    },
    {
      label: "Week Work Hours",
      value: `${data?.summary?.weeklyAttendanceHours || 0}h`,
      icon: CalendarDaysIcon,
    },
  ];
  const notifications = data?.todayTasks || [];
  const visibleNotifications = notificationFilter === "TODO"
    ? notifications.filter((task) => task.status === "TODO")
    : notifications;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Productivity Tracker</h1>
          <p className="page-subtitle">Daily task tracking, work hours, completion rate, and weekly progress</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {isAdmin && (
            <select
              value={selectedEmployeeId}
              onChange={(event) => setSelectedEmployeeId(event.target.value)}
              className="sm:w-64"
            >
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </option>
              ))}
            </select>
          )}
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="sm:w-44"
          />
        </div>
      </div>

      {data?.employee?.isDeleted && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
          This employee account is deactivated. Existing productivity data is visible, but new tasks cannot be added.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-8">
        {summaryCards.map((card) => (
          <div key={card.label} className="card card-hover p-5 flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-slate-500/70 group-hover:bg-indigo-500/70" />
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 transition-colors duration-200">
              <card.icon className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors duration-200" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
              <p className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <BellIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Task Notifications</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {visibleNotifications.length} {notificationFilter === "TODO" ? "to-do" : "total"} task{visibleNotifications.length === 1 ? "" : "s"} for today
              </p>
            </div>
          </div>
          <div className="inline-flex rounded-md border border-slate-200 dark:border-slate-800 p-1 bg-slate-50 dark:bg-slate-950 w-full sm:w-auto">
            {[
              { value: "TODO", label: "To do" },
              { value: "ALL", label: "All" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setNotificationFilter(option.value)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-sm text-sm transition-colors ${notificationFilter === option.value ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {visibleNotifications.slice(0, 6).map((task) => (
            <div key={task.id || task._id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">{task.title}</p>
                  {task.description && <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{task.description}</p>}
                </div>
                <span className={`badge shrink-0 ${statusClass[task.status] || ""}`}>{statusOptions.find((option) => option.value === task.status)?.label}</span>
              </div>
            </div>
          ))}
          {!visibleNotifications.length && (
            <div className="md:col-span-2 xl:col-span-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 p-5 text-center text-slate-400">
              No matching task notifications
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)] gap-6 mb-8">
        <div className="card">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Daily Tasks</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{format(new Date(selectedDate), "MMM dd, yyyy")}</p>
            </div>
            {loading && <Loader2Icon className="w-4 h-4 text-slate-400 animate-spin" />}
          </div>

          <form onSubmit={handleAddTask} className="p-5 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-[minmax(180px,1.2fr)_minmax(160px,1fr)_minmax(112px,0.55fr)_minmax(112px,0.55fr)_minmax(152px,0.7fr)_56px] gap-3">
            <label>
              <span className="sr-only">Task title</span>
              <input
                name="title"
                value={form.title}
                onChange={handleFormChange}
                placeholder="Task title"
                disabled={data?.employee?.isDeleted}
              />
            </label>
            <label>
              <span className="sr-only">Notes</span>
              <input
                name="description"
                value={form.description}
                onChange={handleFormChange}
                placeholder="Notes"
                disabled={data?.employee?.isDeleted}
              />
            </label>
            <label>
              <span className="sr-only">Estimated hours</span>
              <input
                type="number"
                name="estimatedHours"
                min="0"
                step="0.25"
                value={form.estimatedHours}
                onChange={handleFormChange}
                disabled={data?.employee?.isDeleted}
                aria-label="Estimated hours"
              />
            </label>
            <label>
              <span className="sr-only">Actual hours</span>
              <input
                type="number"
                name="actualHours"
                min="0"
                step="0.25"
                value={form.actualHours}
                onChange={handleFormChange}
                disabled={data?.employee?.isDeleted}
                aria-label="Actual hours"
              />
            </label>
            <label>
              <span className="sr-only">Status</span>
              <select
                name="status"
                value={form.status}
                onChange={handleFormChange}
                disabled={data?.employee?.isDeleted}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={saving || data?.employee?.isDeleted}
              className="btn-primary flex items-center justify-center gap-2 sm:col-span-2 2xl:col-span-1 disabled:opacity-60"
            >
              {saving ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <PlusIcon className="w-4 h-4" />}
            </button>
          </form>

          <div className="hidden md:block overflow-x-auto rounded-b-lg">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Estimate</th>
                  <th>Actual</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data?.todayTasks?.length ? (
                  data.todayTasks.map((task) => (
                    <tr key={task.id || task._id}>
                      <td>
                        <p className="font-medium text-slate-900 dark:text-white">{task.title}</p>
                        {task.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{task.description}</p>}
                      </td>
                      <td className="text-slate-600 dark:text-slate-300">{task.estimatedHours || 0}h</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.25"
                          defaultValue={task.actualHours || 0}
                          onBlur={(event) => updateTask(task, { actualHours: event.target.value })}
                          className="w-28"
                        />
                      </td>
                      <td>
                        <select
                          value={task.status}
                          onChange={(event) => updateTask(task, { status: event.target.value })}
                          className={`w-36 ${statusClass[task.status] || ""}`}
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => deleteTask(task)}
                          className="p-2 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          aria-label="Delete task"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      No tasks tracked for this date
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {data?.todayTasks?.length ? (
              data.todayTasks.map((task) => (
                <div key={task.id || task._id} className="p-5 space-y-4">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{task.title}</p>
                    {task.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{task.description}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Estimate</p>
                      <p className="text-sm text-slate-700 dark:text-slate-200">{task.estimatedHours || 0}h</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Actual</p>
                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        defaultValue={task.actualHours || 0}
                        onBlur={(event) => updateTask(task, { actualHours: event.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={task.status}
                      onChange={(event) => updateTask(task, { status: event.target.value })}
                      className={statusClass[task.status] || ""}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => deleteTask(task)}
                      className="p-2 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      aria-label="Delete task"
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-slate-400">No tasks tracked for this date</div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <BarChart3Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Weekly Productivity</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Completion percentage and attendance hours</p>
            </div>
          </div>

          <div className="h-64 flex items-end gap-3 sm:gap-4">
            {data?.weeklyGraph?.map((item) => {
              const completionHeight = Math.max((item.completionPercentage / maxGraphValue) * 100, item.totalTasks ? 8 : 2);
              const hoursHeight = Math.max(((item.workHours * 10) / maxGraphValue) * 100, item.workHours ? 8 : 2);

              return (
                <div key={item.date} className="flex-1 h-full flex flex-col justify-end gap-2">
                  <div className="flex items-end justify-center gap-1 h-44">
                    <div
                      className="w-full max-w-8 rounded-t-md bg-indigo-500"
                      style={{ height: `${completionHeight}%` }}
                      title={`${item.completionPercentage}% complete`}
                    />
                    <div
                      className="w-full max-w-8 rounded-t-md bg-emerald-500"
                      style={{ height: `${hoursHeight}%` }}
                      title={`${item.workHours} work hours`}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{item.label}</p>
                    <p className="text-[11px] text-slate-400">{item.completedTasks}/{item.totalTasks}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-5 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-indigo-500" /> Completion</span>
            <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-emerald-500" /> Work hours</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Productivity;
