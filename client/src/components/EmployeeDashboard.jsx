import { ArrowRightIcon, CalendarIcon, DollarSignIcon, FileTextIcon } from 'lucide-react';
// import React from 'react'
import { Link } from 'react-router-dom';

const EmployeeDashboard = ({data}) => {
    const emp = data.employee;
    const leaveLabels = { SICK: "Sick", CASUAL: "Casual", ANNUAL: "Annual" };

    const cards = [
        {
            icon: CalendarIcon,
            value: data.currentMonthAttendance,
            title: "Days Present",
            subtitle: "This month",
        },
        {
            icon: FileTextIcon,
            value: data.pendingLeaves,
            title: "Pending Leaves",
            subtitle: "Awaiting approval",
        },
        {
            icon: DollarSignIcon,
            value: data.latestPayslip ? `$${data.latestPayslip.netSalary?.toLocaleString()}` : "N/A",
            title: "Latest Payslip",
            subtitle: "Most recent payout",
        },
    ]

  return (
    <div className="animate-fade-in">
        <div className="page-header">
            {/* <h1 className='page-title'>Welcome, {emp?.firstName}!</h1> */}
            <h1 className='page-title'>Welcome, {emp?.firstName} {emp?.lastName}!</h1>
            <p className="page-subtitle">
                {emp?.position} - {emp?.department || "No Department"}
            </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-8'>
            {cards.map((card, index)=>(
                <div key={index} className='card card-hover p-5 sm:p-6 relative overflow-hidden group flex items-center justify-between'>
                    <div>
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-slate-500/70 group-hover:bg-indigo-500/70"/>
                        <p className='text-sm font-medium text-slate-700 dark:text-slate-300'>{card.title}</p>
                        <p className='text-2xl font-bold text-slate-900 dark:text-white mt-1'>{card.value}</p>
                    </div>
                    <card.icon className='size-10 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors duration-200'/>
                </div>
            ))}
        </div>

        <div className="card p-4 sm:p-5 mb-8">
            <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Leave Balance</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Used and remaining days this year</p>
                </div>
                <Link to="/leave" className="text-sm text-indigo-600 dark:text-indigo-300 inline-flex items-center gap-1">
                    Leave <ArrowRightIcon className="w-4 h-4" />
                </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(data.leaveBalance || []).map((leave) => {
                    const usedPercent = leave.allowance ? Math.min((leave.used / leave.allowance) * 100, 100) : 0;

                    return (
                        <div key={leave.type} className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="font-medium text-slate-900 dark:text-white">{leaveLabels[leave.type]}</p>
                                <span className="text-sm text-slate-500 dark:text-slate-400">{leave.remaining} left</span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3" aria-label={`${leaveLabels[leave.type]} leave balance graph`}>
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${usedPercent}%` }} />
                            </div>
                            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                                <span>{leave.used} used</span>
                                <span>{leave.allowance} total</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>

        <div className='flex flex-col sm:flex-row gap-3'>
            <Link to="/attendance" className='btn-primary text-center inline-flex items-center justify-center gap-2'>
                Mark Attendance <ArrowRightIcon className="w-4 h-4" />
            </Link>

            <Link to="/leave" className='btn-secondary text-center'>
                Apply for Leave
            </Link>
        </div>    

    </div>
  )
}

export default EmployeeDashboard
