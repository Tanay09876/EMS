
import { useCallback, useEffect, useState } from "react"
import { DEPARTMENTS } from "../assets/assets"
import { Plus, Search, X} from "lucide-react"
import EmployeeCard from "../components/EmployeeCard"
import EmployeeForm from "../components/EmployeeForm"
import RecoverySearchBar from "../components/RecoverySearchBar"
import api from "../api/axios"

const Employees = () => {
  const [employees, setEmployees] = useState([])
  const [deletedEmployees, setDeletedEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedDept, setSelectedDept] = useState("")
  const [editEmployee, setEditEmployee] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  /* Fetch Employees */
  const fetchEmployees = useCallback(async () => {
    try {
      const url = selectedDept
        ? `/employees?department=${selectedDept}`
        : "/employees"

      const res = await api.get(url)

      setEmployees(res.data)
    } catch {
      console.error("Failed to fetch employees")
    } finally {
      setLoading(false)
    }
  }, [selectedDept])

  /* Fetch Deleted */
  const fetchDeletedEmployees = useCallback(async () => {
    try {
      const res = await api.get("/employees/deleted")

      setDeletedEmployees(res.data)
    } catch {
      console.error("Failed to fetch deleted employees")
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEmployees()
    fetchDeletedEmployees()
  }, [fetchEmployees, fetchDeletedEmployees])

  /* Delete */
  const handleDelete = useCallback(() => {
    fetchEmployees()
    fetchDeletedEmployees()
  }, [fetchEmployees, fetchDeletedEmployees])

  /* Recover */
  const handleRecovered = useCallback(() => {
    fetchEmployees()
    fetchDeletedEmployees()
  }, [fetchEmployees, fetchDeletedEmployees])

  /* Search */
  const filtered = employees.filter((emp) =>
    `${emp.firstName} ${emp.lastName} ${emp.position}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col min-[426px]:flex-row min-[426px]:items-center justify-between gap-4 mb-8">

        {/* Left */}
        <div className="min-w-fit">
          <h1 className="page-title">
            Employees
          </h1>

          <p className="page-subtitle">
            Manage your team members
          </p>
        </div>

        {/* Recovery Search */}
        <div className="flex-1 max-w-2xl">
          <RecoverySearchBar
            deletedEmployees={deletedEmployees}
            onRecovered={handleRecovered}
          />
        </div>

        {/* Add Button */}
     <button onClick={() => setShowCreateModal(true)} className=" btn-primary flex items-center justify-center gap-2 h-11 px-5
      whitespace-nowrap shrink-0 self-stretch min-[426px]:self-auto w-full min-[426px]:w-auto">
      <Plus size={16} />
      Add Employee
      </button>
      </div>

      {/* SEARCH & FILTER */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 " >

        {/* Search */}
        <div className="relative flex-1">

          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />

          <input
            placeholder="Search employees..."
            className="w-full pl-10"
            onChange={(e) => setSearch(e.target.value)}
            value={search}
          />
        </div>

        {/* Department */}
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="max-w-40"
        >
          <option value="">
            All Departments
          </option>

          {DEPARTMENTS.map((deptName) => (
            <option
              key={deptName}
              value={deptName}
            >
              {deptName}
            </option>
          ))}
        </select>
      </div>

      {/* EMPLOYEE CARDS */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">

          {filtered.length === 0 ? (
            <p className="col-span-full text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              No employees found
            </p>
          ) : (
            filtered.map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                onDelete={handleDelete}
                onEdit={(e) => setEditEmployee(e)}
              />
            ))
          )}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div
          className="fixed bg-black/40 backdrop-blur-sm inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="fixed inset-0" />

          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-0">

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Add New Employee
                </h2>

                <p className="text-sm text-slate-500 mt-0.5">
                  Create a user account and employee profile
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6">
              <EmployeeForm
                onSuccess={() => {
                  setShowCreateModal(false)
                  fetchEmployees()
                }}
                onCancel={() => setShowCreateModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editEmployee && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/40 backdrop-blur-sm"
          onClick={() => setEditEmployee(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-0">

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Edit Employee
                </h2>

                <p className="text-sm text-slate-500 mt-0.5">
                  Update employee details
                </p>
              </div>

              <button
                onClick={() => setEditEmployee(null)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6">
              <EmployeeForm
                initialData={editEmployee}
                onSuccess={() => {
                  setEditEmployee(null)
                  fetchEmployees()
                }}
                onCancel={() => setEditEmployee(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Employees





// import { useCallback, useEffect, useState } from "react"
// import { DEPARTMENTS } from "../assets/assets"
// import { Plus, Search, X, Trash2, RotateCcw, ChevronDown, ChevronUp } from "lucide-react"
// import EmployeeCard from "../components/EmployeeCard"
// import EmployeeForm from "../components/EmployeeForm"
// import api from "../api/axios"
// import toast from "react-hot-toast"

// const Employees = () => {
//   const [employees, setEmployees] = useState([])
//   const [deletedEmployees, setDeletedEmployees] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [search, setSearch] = useState("")
//   const [selectedDept, setSelectedDept] = useState("")
//   const [editEmployee, setEditEmployee] = useState(null)
//   const [showCreateModal, setShowCreateModal] = useState(false)
//   const [showDeleted, setShowDeleted] = useState(false)
//   const [recoveringId, setRecoveringId] = useState(null)

//   const fetchEmployees = useCallback(async () => {
//     try {
//       const url = selectedDept ? `/employees?department=${selectedDept}` : "/employees"
//       const res = await api.get(url)
//       setEmployees(res.data)
//     } catch {
//       console.error("Failed to fetch employees")
//     } finally {
//       setLoading(false)
//     }
//   }, [selectedDept])

//   const fetchDeletedEmployees = useCallback(async () => {
//     try {
//       const res = await api.get("/employees/deleted")
//       setDeletedEmployees(res.data)
//     } catch {
//       console.error("Failed to fetch deleted employees")
//     }
//   }, [])

//   useEffect(() => {
//     // eslint-disable-next-line react-hooks/set-state-in-effect
//     fetchEmployees()
//     fetchDeletedEmployees()
//   }, [fetchEmployees, fetchDeletedEmployees])

//   const handleRecover = (emp) => {
//     toast(
//       (t) => (
//         <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: "260px" }}>
//           <div>
//             <p style={{ fontSize: "15px", fontWeight: "600", color: "#1e293b", margin: 0 }}>Recover employee?</p>
//             <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>
//               <span style={{ fontWeight: "600", color: "#334155" }}>{emp.firstName} {emp.lastName}</span> will be able to login again.
//             </p>
//           </div>
//           <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
//             <button
//               onClick={() => toast.dismiss(t.id)}
//               style={{ padding: "8px 16px", fontSize: "13px", fontWeight: "500", color: "#475569", background: "#f1f5f9", border: "none", borderRadius: "8px", cursor: "pointer" }}
//             >
//               Cancel
//             </button>
//             <button
//               onClick={async () => {
//                 toast.dismiss(t.id)
//                 setRecoveringId(emp.id)
//                 try {
//                   await api.patch(`/employees/${emp.id}/recover`)
//                   toast.success(`${emp.firstName} ${emp.lastName} recovered successfully`)
//                   fetchEmployees()
//                   fetchDeletedEmployees()
//                 } catch (err) {
//                   toast.error(err.response?.data?.error || "Failed to recover employee")
//                 } finally {
//                   setRecoveringId(null)
//                 }
//               }}
//               style={{ padding: "8px 16px", fontSize: "13px", fontWeight: "600", color: "#fff", background: "#059669", border: "none", borderRadius: "8px", cursor: "pointer" }}
//             >
//               Yes, Recover
//             </button>
//           </div>
//         </div>
//       ),
//       { duration: 8000 }
//     )
//   }

//   const handleDelete = useCallback(() => {
//     fetchEmployees()
//     fetchDeletedEmployees()
//   }, [fetchEmployees, fetchDeletedEmployees])

//   const filtered = employees.filter((emp) =>
//     `${emp.firstName} ${emp.lastName} ${emp.position}`
//       .toLowerCase()
//       .includes(search.toLowerCase())
//   )

//   return (
//     <div className="animate-fade-in">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
//         <div>
//           <h1 className="page-title">Employees</h1>
//           <p className="page-subtitle">Manage your team members</p>
//         </div>
//         <button
//           onClick={() => setShowCreateModal(true)}
//           className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
//         >
//           <Plus size={16} /> Add Employee
//         </button>
//       </div>

//       {/* Search & Filter */}
//       <div className="flex flex-col sm:flex-row gap-3 mb-6">
//         <div className="relative flex-1">
//           <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
//           <input
//             placeholder="Search employees..."
//             className="w-full pl-10!"
//             onChange={(e) => setSearch(e.target.value)}
//             value={search}
//           />
//         </div>
//         <select
//           value={selectedDept}
//           onChange={(e) => setSelectedDept(e.target.value)}
//           className="max-w-40"
//         >
//           <option value="">All Departments</option>
//           {DEPARTMENTS.map((deptName) => (
//             <option key={deptName} value={deptName}>{deptName}</option>
//           ))}
//         </select>
//       </div>

//       {/* Active Employee Cards */}
//       {loading ? (
//         <div className="flex justify-center p-12">
//           <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
//           {filtered.length === 0 ? (
//             <p className="col-span-full text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
//               No employees found
//             </p>
//           ) : (
//             filtered.map((emp) => (
//               <EmployeeCard
//                 key={emp.id}
//                 employee={emp}
//                 onDelete={handleDelete}
//                 onEdit={(e) => setEditEmployee(e)}
//               />
//             ))
//           )}
//         </div>
//       )}

//       {/* Deleted Employees Section */}
//       <div className="mt-10">
//         <button
//           onClick={() => setShowDeleted((v) => !v)}
//           className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-rose-600 transition-colors"
//         >
//           <Trash2 size={15} />
//           Deleted Employees
//           {deletedEmployees.length > 0 && (
//             <span className="bg-rose-100 text-rose-600 text-xs font-semibold px-2 py-0.5 rounded-full">
//               {deletedEmployees.length}
//             </span>
//           )}
//           {showDeleted ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
//         </button>

//         {showDeleted && (
//           <div className="mt-4">
//             {deletedEmployees.length === 0 ? (
//               <p className="text-center py-10 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 text-sm">
//                 No deleted employees
//               </p>
//             ) : (
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
//                 {deletedEmployees.map((emp) => (
//                   <DeletedEmployeeCard
//                     key={emp.id}
//                     employee={emp}
//                     onRecover={handleRecover}
//                     recovering={recoveringId === emp.id}
//                   />
//                 ))}
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Create Employee Modal */}
//       {showCreateModal && (
//         <div
//           className="fixed bg-black/40 backdrop-blur-sm inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
//           onClick={() => setShowCreateModal(false)}
//         >
//           <div className="fixed inset-0" />
//           <div
//             className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 animate-fade-in"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="flex items-center justify-between p-6 pb-0">
//               <div>
//                 <h2 className="text-lg font-semibold text-slate-900">Add New Employee</h2>
//                 <p className="text-sm text-slate-500 mt-0.5">Create a user account and employee profile</p>
//               </div>
//               <button
//                 onClick={() => setShowCreateModal(false)}
//                 className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>
//             <div className="p-6">
//               <EmployeeForm
//                 onSuccess={() => { setShowCreateModal(false); fetchEmployees() }}
//                 onCancel={() => setShowCreateModal(false)}
//               />
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Edit Employee Modal */}
//       {editEmployee && (
//         <div
//           className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/40 backdrop-blur-sm"
//           onClick={() => setEditEmployee(null)}
//         >
//           <div
//             className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 animate-fade-in"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="flex items-center justify-between p-6 pb-0">
//               <div>
//                 <h2 className="text-lg font-semibold text-slate-900">Edit Employee</h2>
//                 <p className="text-sm text-slate-500 mt-0.5">Update employee details</p>
//               </div>
//               <button
//                 onClick={() => setEditEmployee(null)}
//                 className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>
//             <div className="p-6">
//               <EmployeeForm
//                 initialData={editEmployee}
//                 onSuccess={() => { setEditEmployee(null); fetchEmployees() }}
//                 onCancel={() => setEditEmployee(null)}
//               />
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// // Deleted Employee Card
// const DeletedEmployeeCard = ({ employee, onRecover, recovering }) => (
//   <div className="relative card overflow-hidden opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300">
//     <div className="relative aspect-4/3 w-full overflow-hidden bg-linear-to-br from-slate-50 to-slate-100">
//       <div className="w-full h-full flex items-center justify-center">
//         {employee.profileImage ? (
//           <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white overflow-hidden ring-1 ring-slate-200">
//             <img
//               src={employee.profileImage}
//               alt={`${employee.firstName} ${employee.lastName}`}
//               className="w-full h-full object-cover"
//             />
//           </div>
//         ) : (
//           <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-rose-100 flex items-center justify-center">
//             <span className="text-3xl font-medium text-rose-300">
//               {employee.firstName[0]}{employee.lastName[0]}
//             </span>
//           </div>
//         )}
//       </div>
//     </div>

//     <div className="absolute top-3 left-3 flex gap-2">
//       <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-slate-600 rounded-lg shadow-sm">
//         {employee.department || "Remote"}
//       </span>
//       <span className="bg-rose-500 text-white px-2.5 py-1 text-xs font-semibold rounded-lg shadow-sm">
//         Deleted
//       </span>
//     </div>

//     <div className="absolute inset-0 bg-linear-to-t from-rose-700/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
//       <button
//         onClick={() => onRecover(employee)}
//         disabled={recovering}
//         className="flex items-center gap-1.5 px-4 py-2 bg-white/90 backdrop-blur-sm text-emerald-700 hover:text-emerald-800 hover:bg-white font-medium text-sm rounded-xl shadow-lg transition-all hover:scale-105 disabled:opacity-50"
//       >
//         <RotateCcw size={14} className={recovering ? "animate-spin" : ""} />
//         {recovering ? "Recovering…" : "Recover"}
//       </button>
//     </div>

//     <div className="p-5 bg-white">
//       <h3 className="text-slate-900 line-through decoration-rose-300">
//         {employee.firstName} {employee.lastName}
//       </h3>
//       <p className="text-xs text-slate-400">{employee.position}</p>
//     </div>
//   </div>
// )

// export default Employees
