import { useCallback, useEffect, useState } from "react"
import Loading from "../components/Loading";
import PayslipList from "../components/payslip/PayslipList";
import GeneratePayslipForm from "../components/payslip/GeneratePayslipForm";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";


const Payslips = () => {
  const [payslips, setPayslips] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true);

  const { user } = useAuth()
  const isAdmin = user?.role === "ADMIN";

  const fetchPayslips = useCallback(async () => {
    try {
      const res = await api.get('/payslips')
      // ✅ FIXED: safely handle both {data:[]} and [] response shapes
      const data = res.data?.data ?? res.data ?? []
      setPayslips(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message);
    } finally {
      setLoading(false)
    }
  }, [])

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
      <PayslipList payslips={payslips} isAdmin={isAdmin} />
    </div>
  )
}

export default Payslips