// import { PencilIcon, Trash2Icon } from 'lucide-react'
// // import React from 'react'
// import api from '../api/axios';
// import toast from 'react-hot-toast';

// const EmployeeCard = ({employee, onDelete, onEdit}) => {

//     const handleDelete = async ()=>{
//         if(!confirm("Are you sure you want to delete this employee?")) return;
//         try {
//             await api.delete(`/employees/${employee.id}`)
//             onDelete()
//         } catch (err) {
//             toast.error(err.response?.data?.error || err.message);
//         }
//     }

//   return (
//     <div className='group relative card card-hover overflow-hidden'>

//         <div className='relative aspect-4/3 w-full overflow-hidden bg-linear-to-br from-slate-50 to-slate-100'>
            
//             <div className='w-full h-full flex items-center justify-center'>
//                 {/* circle icons  */}
//                 {employee.profileImage ? (
//                     <div className='w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white overflow-hidden ring-1 ring-slate-200'>
//                         <img src={employee.profileImage} alt={`${employee.firstName} ${employee.lastName}`} className='w-full h-full object-cover'/>
//                     </div>
//                 ) : (
//                     <div className='w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-indigo-100 flex items-center justify-center'>
//                         <span className='text-3xl font-medium text-indigo-400'>
//                             {employee.firstName[0]}{employee.lastName[0]}
//                         </span>
//                     </div>
//                 )}
//             </div>
//         </div>

//         <div className='absolute top-3 left-3 flex gap-2'>
//             <span className='bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-slate-600 rounded-lg shadow-sm'>{employee.department || "Remote"}</span>
//             {employee.isDeleted && <span className='bg-red-500/60 font-medium text-white px-2.5 py-1 text-xs rounded'>DELETED</span>}
//         </div>

//         {!employee.isDeleted && (
//             <div className='absolute inset-0 bg-linear-to-t from-indigo-700/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6 gap-3'>
//                 <button onClick={()=> onEdit(employee)} className='p-2.5 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-indigo-600 rounded-xl shadow-lg transition-all hover:scale-105'>
//                     <PencilIcon className="w-4 h-4"/>
//                 </button>
//                 <button onClick={handleDelete} className='p-2.5 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-rose-600 rounded-xl shadow-lg transition-all hover:scale-105 disabled:opacity-50'>
//                     <Trash2Icon className="w-4 h-4"/>
//                 </button>
//             </div>
//         )}

//         <div className='p-5 bg-white'>
//             <h3 className='text-slate-900'>{employee.firstName} {employee.lastName}</h3>
//             <p className='text-xs text-slate-500'>{employee.position}</p>
//         </div>
//     </div>
//   )
// }

// export default EmployeeCard
import { PencilIcon, Trash2Icon } from 'lucide-react'
import api from '../api/axios';
import toast from 'react-hot-toast';

const EmployeeCard = ({ employee, onDelete, onEdit }) => {

  const handleDelete = () => {
    toast(
      (t) => (
        <div className="flex flex-col gap-4" style={{ minWidth: "260px" }}>
          <div>
            <p style={{ fontSize: "15px", fontWeight: "600", color: "#1e293b", margin: 0 }}>Delete employee?</p>
            <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", margin: "4px 0 0 0" }}>
              <span style={{ fontWeight: "600", color: "#334155" }}>{employee.firstName} {employee.lastName}</span> will be deactivated and can be recovered later.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "500",
                color: "#475569",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id)
                try {
                  await api.delete(`/employees/${employee.id}`)
                  toast.success(`${employee.firstName} ${employee.lastName} deleted`)
                  onDelete()
                } catch (err) {
                  toast.error(err.response?.data?.error || err.message)
                }
              }}
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "600",
                color: "#fff",
                background: "#e11d48",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Yes, Delete
            </button>
          </div>
        </div>
      ),
      { duration: 8000 }
    )
  }

  return (
    <div className='group relative card card-hover overflow-hidden'>

      <div className='relative aspect-4/3 w-full overflow-hidden bg-linear-to-br from-slate-50 to-slate-100'>
        <div className='w-full h-full flex items-center justify-center'>
          {employee.profileImage ? (
            <div className='w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white overflow-hidden ring-1 ring-slate-200'>
              <img src={employee.profileImage} alt={`${employee.firstName} ${employee.lastName}`} className='w-full h-full object-cover' />
            </div>
          ) : (
            <div className='w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-indigo-100 flex items-center justify-center'>
              <span className='text-3xl font-medium text-indigo-400'>
                {employee.firstName[0]}{employee.lastName[0]}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className='absolute top-3 left-3 flex gap-2'>
        <span className='bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-slate-600 rounded-lg shadow-sm'>
          {employee.department || "Remote"}
        </span>
      </div>

      <div className='absolute inset-0 bg-linear-to-t from-indigo-700/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6 gap-3'>
        <button
          onClick={() => onEdit(employee)}
          className='p-2.5 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-indigo-600 rounded-xl shadow-lg transition-all hover:scale-105'
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          className='p-2.5 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-rose-600 rounded-xl shadow-lg transition-all hover:scale-105'
        >
          <Trash2Icon className="w-4 h-4" />
        </button>
      </div>

      <div className='p-5 bg-white'>
        <h3 className='text-slate-900'>{employee.firstName} {employee.lastName}</h3>
        <p className='text-xs text-slate-500'>{employee.position}</p>
      </div>
    </div>
  )
}

export default EmployeeCard