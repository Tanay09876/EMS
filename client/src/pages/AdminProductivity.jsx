import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3Icon,
  BriefcaseBusinessIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  SearchIcon,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import api from "../api/axios";
import Loading from "../components/Loading";
import { useAuth } from "../context/AuthContext";

const AdminProductivity = () => {
  const { user } = useAuth();
  const [teamData, setTeamData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(true);

  const departments = useMemo(() => {
    const values = employees.map((employee) => employee.department).filter(Boolean);
    return ["ALL", ...Array.from(new Set(values)).sort()];
  }, [employees]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (teamData?.employees || []).filter((row) => {
      const matchesDepartment =
        selectedDepartment === "ALL" || row.employee.department === selectedDepartment;
      const matchesSearch =
        !term ||
        `${row.employee.firstName} ${row.employee.lastName} ${row.employee.position || ""}`
          .toLowerCase()
          .includes(term);

      return matchesDepartment && matchesSearch;
    });
  }, [search, selectedDepartment, teamData]);

  const filteredSummary = useMemo(() => {
    const totals = filteredRows.reduce(
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

    return {
      ...totals,
      weeklyHours: Number(totals.weeklyHours.toFixed(2)),
      completionPercentage: totals.todayTasks
        ? Math.round((totals.completedToday / totals.todayTasks) * 100)
        : 0,
    };
  }, [filteredRows]);

  const fetchEmployees = useCallback(async () => {
    const res = await api.get("/employees");
    setEmployees(res.data || []);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/productivity/admin/all", { params: { date: selectedDate } });
      setTeamData(res.data);
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEmployees().catch((error) => toast.error(error?.response?.data?.error || error?.message));
  }, [fetchEmployees, user?.role]);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData, user?.role]);

  if (user?.role !== "ADMIN") {
    return <p className="text-center text-slate-500 dark:text-slate-400 py-12">Admin access required</p>;
  }

  if (loading && !teamData) return <Loading />;

  const summaryCards = [
    { label: "Completion", value: `${filteredSummary.completionPercentage}%`, icon: CheckCircle2Icon },
    { label: "Daily Tasks", value: `${filteredSummary.completedToday}/${filteredSummary.todayTasks}`, icon: BriefcaseBusinessIcon },
    { label: "Week Tasks", value: `${filteredSummary.completedWeek}/${filteredSummary.weekTasks}`, icon: CalendarDaysIcon },
    { label: "Week Hours", value: `${filteredSummary.weeklyHours}h`, icon: ClockIcon },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Team Productivity</h1>
          <p className="page-subtitle">Filter active employees by department and review productivity together</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[220px_240px_176px] gap-3 w-full lg:w-auto">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee"
              className="pl-9"
            />
          </div>
          <select
            value={selectedDepartment}
            onChange={(event) => setSelectedDepartment(event.target.value)}
            aria-label="Department"
          >
            {departments.map((department) => (
              <option key={department} value={department}>
                {department === "ALL" ? "All Departments" : department}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-8">
        {summaryCards.map((card) => (
          <div key={card.label} className="card card-hover p-5 flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-slate-500/70 group-hover:bg-indigo-500/70" />
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <card.icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
              <p className="text-2xl font-medium text-slate-900 dark:text-white tracking-tight">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <BarChart3Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Department Completion</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Selected department for {format(new Date(selectedDate), "MMM dd, yyyy")}</p>
            </div>
          </div>
          <div className="space-y-4">
            {filteredRows.map((row) => (
              <div key={row.employee.id}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {row.employee.firstName} {row.employee.lastName}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">{row.completionPercentage}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${row.completionPercentage}%` }}
                  />
                </div>
              </div>
            ))}
            {!filteredRows.length && (
              <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400">
                No employees found for this filter
              </div>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-white">Active Employee Productivity</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Deleted employees and their productivity tasks are not shown</p>
          </div>
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Today</th>
                  <th>Week</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.employee.id}>
                    <td>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {row.employee.firstName} {row.employee.lastName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{row.employee.position}</p>
                    </td>
                    <td className="text-slate-600 dark:text-slate-300">{row.employee.department || "-"}</td>
                    <td className="text-slate-600 dark:text-slate-300">{row.completedToday}/{row.todayTasks}</td>
                    <td className="text-slate-600 dark:text-slate-300">{row.completedWeek}/{row.weekTasks}</td>
                    <td className="text-slate-600 dark:text-slate-300">{row.weeklyHours}h</td>
                  </tr>
                ))}
                {!filteredRows.length && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">No active employees found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductivity;
