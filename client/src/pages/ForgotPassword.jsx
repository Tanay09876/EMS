import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import LoginLeftSide from "../components/LoginLeftSide";
import api from "../api/axios";
import toast from "react-hot-toast";

const ForgotPassword = () => {
    const { role } = useParams();
    const navigate = useNavigate();
    const isAdmin = role === "admin";
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const requestOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = isAdmin
                ? "/auth/forgot-password/admin/request-otp"
                : "/auth/forgot-password/employee/request-otp";
            await api.post(url, {email});
            setOtpSent(true);
            toast.success("OTP sent to your email");
        } catch (error) {
            toast.error(error.response?.data?.error || error.message);
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = isAdmin
                ? "/auth/forgot-password/admin/reset"
                : "/auth/forgot-password/employee/reset";
            await api.post(url, {email, otp, newPassword});
            toast.success("Password reset successfully");
            navigate(`/login/${role}`);
        } catch (error) {
            toast.error(error.response?.data?.error || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='min-h-screen flex flex-col md:flex-row'>
            <LoginLeftSide />
            <div className='flex-1 flex items-center justify-center p-6 sm:p-12 bg-white'>
                <div className="w-full max-w-md animate-fade-in">
                    <Link to={`/login/${role}`} className='inline-flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm mb-10 transition-colors'>
                        <ArrowLeftIcon size={16}/> Back to login
                    </Link>

                    <div className="mb-8">
                        <h1 className='text-2xl sm:text-3xl font-medium text-zinc-800'>Reset Password</h1>
                        <p className='text-slate-500 text-sm sm:text-base mt-2'>
                            Verify your {role} email with OTP.
                        </p>
                    </div>

                    {!otpSent ? (
                        <form className='space-y-5' onSubmit={requestOtp}>
                            <div>
                                <label className='block text-sm font-medium text-slate-700 mb-2'>Email address</label>
                                <input type="email" value={email} onChange={(e)=> setEmail(e.target.value)} required placeholder='john@example.com'/>
                            </div>
                            <button type='submit' disabled={loading} className='w-full btn-primary flex items-center justify-center'>
                                {loading && <Loader2Icon className="animate-spin h-4 w-4 mr-2"/>}
                                Send OTP
                            </button>
                        </form>
                    ) : (
                        <form className='space-y-5' onSubmit={resetPassword}>
                            <div>
                                <label className='block text-sm font-medium text-slate-700 mb-2'>Email address</label>
                                <input type="email" value={email} onChange={(e)=> setEmail(e.target.value)} required disabled={otpSent} className={otpSent ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""} />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-slate-700 mb-2'>OTP</label>
                                <input value={otp} onChange={(e)=> setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} required minLength={6} maxLength={6} placeholder='123456'/>
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-slate-700 mb-2'>New Password</label>
                                <input type="password" value={newPassword} onChange={(e)=> setNewPassword(e.target.value)} required minLength={6} placeholder='Minimum 6 characters'/>
                            </div>
                            <button type='submit' disabled={loading} className='w-full btn-primary flex items-center justify-center'>
                                {loading && <Loader2Icon className="animate-spin h-4 w-4 mr-2"/>}
                                Reset Password
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
