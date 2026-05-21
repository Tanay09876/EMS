import { Loader2, Plus, X } from 'lucide-react'
import { useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const GeneratePayslipForm = ({ employees, onSuccess }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})

    const validate = (data) => {
        const newErrors = {}

        // Basic Salary — required + must be > 0
        if (!data.basicSalary || data.basicSalary === "") {
            newErrors.basicSalary = "Basic salary is required"
        } else if (Number(data.basicSalary) <= 0) {
            newErrors.basicSalary = "Basic salary must be greater than 0"
        }

        // Allowances — optional but no negative
        if (data.allowances !== "" && data.allowances !== undefined && Number(data.allowances) < 0) {
            newErrors.allowances = "Allowances cannot be negative"
        }

        // Deductions — optional but no negative
        if (data.deductions !== "" && data.deductions !== undefined && Number(data.deductions) < 0) {
            newErrors.deductions = "Deductions cannot be negative"
        }

        return newErrors
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries())

        // Run validation before API call
        const validationErrors = validate(data)
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            return
        }

        setErrors({})
        setLoading(true)
        try {
            await api.post('/payslips', data)
            setIsOpen(false)
            onSuccess()
        } catch (err) {
            toast.error(err.response?.data?.error || err?.message);
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setIsOpen(false)
        setErrors({})
    }

    // Block minus sign, 'e', and '+' from being typed in number inputs
    const blockInvalidChars = (e) => {
        if (e.key === '-' || e.key === 'e' || e.key === '+') {
            e.preventDefault()
        }
    }

    const clearError = (field) => setErrors((prev) => ({ ...prev, [field]: undefined }))

    if (!isOpen) return (
        <button
            onClick={() => setIsOpen(true)}
            className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Generate Payslip
        </button>
    )

    return (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
            <div className='card max-w-lg w-full p-6 animate-slide-up'>
                <div className='flex justify-between items-center mb-6'>
                    <h3 className='text-lg font-bold text-slate-900'>Generate Monthly Payslip</h3>
                    <button onClick={handleClose} className='text-slate-400 hover:text-slate-600 p-1'>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Select Employee */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Employee <span className="text-red-500">*</span>
                        </label>
                        <select name="employeeId" required>
                            {employees.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.firstName} {e.lastName} ({e.position})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Month & Year */}
                    <div className='grid grid-cols-2 gap-4'>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Month <span className="text-red-500">*</span>
                            </label>
                            <select name="month">
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Year <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="year"
                                defaultValue={new Date().getFullYear()}
                                min="2000"
                                onKeyDown={blockInvalidChars}
                            />
                        </div>
                    </div>

                    {/* Basic Salary — required */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Basic Salary <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="basicSalary"
                            placeholder="e.g. 5000"
                            min="0.01"
                            step="0.01"
                            onKeyDown={blockInvalidChars}
                            onChange={() => clearError('basicSalary')}
                            className={errors.basicSalary ? 'border-red-400 focus:ring-red-300' : ''}
                        />
                        {errors.basicSalary && (
                            <p className="mt-1 text-xs text-red-500">{errors.basicSalary}</p>
                        )}
                    </div>

                    {/* Allowances & Deductions — optional */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Allowances
                                <span className="ml-1 text-xs text-slate-400 font-normal">(optional)</span>
                            </label>
                            <input
                                type="number"
                                name="allowances"
                                placeholder="0"
                                min="0"
                                step="0.01"
                                defaultValue=""
                                onKeyDown={blockInvalidChars}
                                onChange={() => clearError('allowances')}
                                className={errors.allowances ? 'border-red-400 focus:ring-red-300' : ''}
                            />
                            {errors.allowances && (
                                <p className="mt-1 text-xs text-red-500">{errors.allowances}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Deductions
                                <span className="ml-1 text-xs text-slate-400 font-normal">(optional)</span>
                            </label>
                            <input
                                type="number"
                                name="deductions"
                                placeholder="0"
                                min="0"
                                step="0.01"
                                defaultValue=""
                                onKeyDown={blockInvalidChars}
                                onChange={() => clearError('deductions')}
                                className={errors.deductions ? 'border-red-400 focus:ring-red-300' : ''}
                            />
                            {errors.deductions && (
                                <p className="mt-1 text-xs text-red-500">{errors.deductions}</p>
                            )}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={handleClose} type='button' className='btn-secondary'>
                            Cancel
                        </button>
                        <button disabled={loading} type='submit' className='btn-primary flex items-center'>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Generate
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default GeneratePayslipForm