import { CalendarDays, Clock, FileText, Loader2, Send, X } from 'lucide-react';
import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ApplyLeaveModal = ({ open, onClose, onSuccess }) => {

    const [loading, setLoading] = useState(false);
    const [leaveType, setLeaveType] = useState('SICK');
    const [halfDayPeriod, setHalfDayPeriod] = useState(null);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (leaveType === 'HALF_DAY' && !halfDayPeriod) {
            toast.error('Please select First Half or Second Half');
            return;
        }

        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        if (leaveType === 'HALF_DAY') {
            data.halfDayPeriod = halfDayPeriod;
            data.endDate = data.startDate;
        }

        try {
            await api.post('/leave', data);
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.error || err?.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setLeaveType('SICK');
        setHalfDayPeriod(null);
        onClose();
    };

    if (!open) return null;

    return (
        <div
            className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm'
            onClick={handleClose}
        >
            <div
                className='relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in'
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className='flex items-center justify-between p-4 sm:p-6 pb-0'>
                    <div>
                        <h2 className='text-base sm:text-lg font-semibold text-slate-800'>Apply for Leave</h2>
                        <p className='text-xs sm:text-sm text-slate-400 mt-0.5'>Submit your leave request for approval</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className='p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 shrink-0'
                    >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className='p-4 sm:p-6 space-y-4 sm:space-y-5'>

                    {/* Leave Type */}
                    <div>
                        <label className='flex items-center gap-2 text-sm font-medium text-slate-700 mb-2'>
                            <FileText className="w-4 h-4 text-slate-400" />
                            Leave Type
                        </label>
                        <select
                            name="type"
                            required
                            value={leaveType}
                            onChange={(e) => {
                                setLeaveType(e.target.value);
                                setHalfDayPeriod(null);
                            }}
                            className='w-full'
                        >
                            <option value="SICK">Sick Leave</option>
                            <option value="CASUAL">Casual Leave</option>
                            <option value="ANNUAL">Annual Leave</option>
                            <option value="HALF_DAY">Half Day</option>
                        </select>
                    </div>

                    {/* Half Day Period Selector */}
                    {leaveType === 'HALF_DAY' && (
                        <div>
                            <label className='flex items-center gap-2 text-sm font-medium text-slate-700 mb-2'>
                                <Clock className="w-4 h-4 text-slate-400" />
                                Which half?
                            </label>
                            <div className='grid grid-cols-2 gap-2 sm:gap-3'>
                                <button
                                    type="button"
                                    onClick={() => setHalfDayPeriod('FIRST')}
                                    className={`py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl border-2 transition-all text-sm font-medium
                                        ${halfDayPeriod === 'FIRST'
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                                        }`}
                                >
                                    First Half
                                    <span className='block text-sm font-normal mt-0.5 opacity-70'>Morning</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setHalfDayPeriod('SECOND')}
                                    className={`py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl border-2 transition-all text-sm font-medium
                                        ${halfDayPeriod === 'SECOND'
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                                        }`}
                                >
                                    Second Half
                                    <span className='block text-sm font-normal mt-0.5 opacity-70'>Afternoon</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Duration */}
                    {leaveType === 'HALF_DAY' ? (
                        <div>
                            <label className='flex items-center gap-2 text-sm font-medium text-slate-700 mb-2'>
                                <CalendarDays className="w-4 h-4 text-slate-400" />
                                Date
                            </label>
                            <input type="date" name="startDate" required min={minDate} className='w-full' />
                        </div>
                    ) : (
                        <div>
                            <label className='flex items-center gap-2 text-sm font-medium text-slate-700 mb-2'>
                                <CalendarDays className="w-4 h-4 text-slate-400" />
                                Duration
                            </label>
                            <div className='grid grid-cols-2 gap-3 sm:gap-4'>
                                <div>
                                    <span className="block text-xs text-slate-400 mb-1">From</span>
                                    <input type="date" name="startDate" required min={minDate} className='w-full' />
                                </div>
                                <div>
                                    <span className="block text-xs text-slate-400 mb-1">To</span>
                                    <input type="date" name="endDate" required min={minDate} className='w-full' />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reason */}
                    <div>
                        <label className='text-sm font-medium text-slate-700 mb-2 block'>
                            Reason
                        </label>
                        <textarea
                            name="reason"
                            required
                            rows={3}
                            className="resize-none w-full"
                            placeholder="Briefly describe why you need this leave..."
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
                        <button type='button' onClick={handleClose} className="btn-secondary flex-1 text-sm sm:text-base py-2 sm:py-2.5">
                            Cancel
                        </button>
                        <button
                            disabled={loading}
                            type='submit'
                            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm sm:text-base py-2 sm:py-2.5"
                        >
                            {loading ? <Loader2 className='w-4 h-4 animate-spin' /> : <Send className="w-4 h-4" />}
                            {loading ? "Submitting..." : "Submit"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default ApplyLeaveModal;