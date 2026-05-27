import { useCallback, useEffect, useState } from "react"
import Loading from "../components/Loading";
import PayslipList from "../components/payslip/PayslipList";
import GeneratePayslipForm from "../components/payslip/GeneratePayslipForm";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Search } from "lucide-react";


const Payslips = () => {
  const [payslips, setPayslips] = useState([])
  const [employees, setEmployees] = useState([])
  const [filters, setFilters] = useState({ search: "", period: "", department: "ALL" })
  const [loading, setLoading] = useState(true);

  const { user } = useAuth()
  const isAdmin = user?.role === "ADMIN";
  const departments = ["ALL", ...Array.from(new Set(employees.map((employee) => employee.department).filter(Boolean))).sort()]

  const fetchPayslips = useCallback(async () => {
    try {
      const params = isAdmin ? filters : {}
      const res = await api.get('/payslips', { params })
      // ✅ FIXED: safely handle both {data:[]} and [] response shapes
      const data = res.data?.data ?? res.data ?? []
      setPayslips(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message);
    } finally {
      setLoading(false)
    }
  }, [filters, isAdmin])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPayslips()
  }, [fetchPayslips])

  useEffect(() => {
    if (isAdmin) {
      api.get("/employees")
        .then((res) => {
          // ✅ FIXED: safely handle both {data:[]} and [] response shapes
          const list = res.data?.data ?? res.data ?? []
          const active = Array.isArray(list) ? list.filter((e) => !e.isDeleted) : []
          setEmployees(active)
        })
        .catch(() => {})
    }
  }, [isAdmin])

  if (loading) return <Loading />

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="page-title">Payslips</h1>
          <p className="page-subtitle">
            {isAdmin ? "Generate and manage employee payslips" : "Your payslip history"}
          </p>
        </div>
        {isAdmin && (
          <GeneratePayslipForm employees={employees} onSuccess={fetchPayslips} />
        )}
      </div>
      {isAdmin && (
        <div className="card p-4 mb-6 grid grid-cols-1 md:grid-cols-[1fr_180px_220px] gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search employee"
              className="pl-9"
            />
          </div>
           {/* <input
            type="month"
            value={filters.period}
            onChange={(event) => setFilters((current) => ({ ...current, period: event.target.value }))}
            placeholder="MM-YYYY"
          /> */}
          <input
  type={filters.period ? "month" : "text"}
  value={filters.period}
  placeholder="MM-YYYY"
  className="border rounded px-3 py-2 w-full"
  onFocus={(e) => (e.target.type = "month")}
  onBlur={(e) => {
    if (!filters.period) {
      e.target.type = "text";
    }
  }}
  onChange={(event) =>
    setFilters((current) => ({
      ...current,
      period: event.target.value,
    }))
  }
/>
          <select
            value={filters.department}
            onChange={(event) => setFilters((current) => ({ ...current, department: event.target.value }))}
          >
            {departments.map((department) => (
              <option key={department} value={department}>
                {department === "ALL" ? "All Departments" : department}
              </option>
            ))}
          </select>
        </div>
      )}
      <PayslipList payslips={payslips} isAdmin={isAdmin} />
    </div>
  )
}

export default Payslips
