import { Building2Icon, CalendarIcon, FileTextIcon, UsersIcon } from 'lucide-react'
// import React from 'react'

const AdminDashboard = ({ data }) => {
    const stats = [
        {
            icon: UsersIcon,
            value: data.totalEmployees,
            label: "Total Employees",
            description: "Active workforce",
        },
        {
            icon: Building2Icon,
            value: data.totalDepartments,
            label: "Departments",
            description: "Organization units",
        },
        {
            icon: CalendarIcon,
            value: data.todayAttendance,
            label: "Today's Attendance",
            description: "Checked in today",
        },
        {
            icon: FileTextIcon,
            value: data.pendingLeaves,
            label: "Pending Leaves",
            description: "Awaiting approval",
        },
    ]
  return (
       <div className="animate-fade-in">
        <div className="page-header">
            <h1 className='page-title'>Dashboard</h1>
            <p className="page-subtitle">
                Welcome back, Admin — here's your overview
            </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8'>
            {stats.map((s)=>(
                <div key={s.label} className='card card-hover p-5 sm:p-6 relative overflow-hidden group flex items-center justify-between'>
                    <div>
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-slate-500/70 group-hover:bg-indigo-500/70"/>
                        <p className='text-sm font-medium text-slate-700 dark:text-slate-300'>{s.label}</p>
                        <p className='text-2xl font-bold text-slate-900 dark:text-white mt-1'>{s.value}</p>
                    </div>
                    <s.icon className='size-10 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors duration-200'/>
                </div>
            ))}
        </div>   

    </div>
  )
}

export default AdminDashboard
