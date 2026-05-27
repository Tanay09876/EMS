import { useCallback, useEffect, useState } from "react"
// import {dummyProfileData} from "../assets/assets"
import Loading from "../components/Loading"
import { Loader2, Lock, Save } from "lucide-react"
import ProfileForm from "../components/ProfileForm"
import ChangePasswordModal from "../components/ChangePasswordModal"
import { useAuth } from "../context/AuthContext"
import api from "../api/axios"
import toast from "react-hot-toast"
import { currencyOptions, getCurrency } from "../utils/currency"


const Settings = () => {
  const {user} = useAuth()

  const [profile, setProfile] = useState(null)
  const [orgSettings, setOrgSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const fetchProfile = useCallback(async () => {
   try {
    const res = await api.get("/profile")
    const profile = res.data;
    if(profile) setProfile(profile)
    if(user?.role === "ADMIN"){
      const settingsRes = await api.get("/settings")
      setOrgSettings(settingsRes.data)
    }
   } catch (err) {
    toast.error(err?.response?.data?.error || err?.message)
   }finally{
    setLoading(false)
   }
  }, [user])

  useEffect(()=>{
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile()
  },[fetchProfile])

  const updateSetting = (field, value) => {
    setOrgSettings((current) => ({ ...current, [field]: value }))
  }

  const updateCurrency = (code) => {
    const currency = getCurrency(code)
    setOrgSettings((current) => ({
      ...current,
      currencyCode: currency.code,
      currencySymbol: currency.symbol,
    }))
  }

  const saveOrgSettings = async (event) => {
    event.preventDefault()
    if (!orgSettings) return

    try {
      setSavingSettings(true)
      const res = await api.put("/settings", orgSettings)
      setOrgSettings(res.data.data)
      toast.success("Settings updated")
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message)
    } finally {
      setSavingSettings(false)
    }
  }

  if(loading) return <Loading />

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      {profile && <ProfileForm initialData={profile} onSuccess={fetchProfile}/>}

      {user?.role === "ADMIN" && orgSettings && (
        <form onSubmit={saveOrgSettings} className="card p-5 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Leave Policy</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Control yearly leave limits and annual leave payout for payslips
              </p>
            </div>
            <button disabled={savingSettings} className="btn-primary inline-flex items-center justify-center gap-2">
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Policy
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <label>
              <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sick Leave</span>
              <input
                type="number"
                min="0"
                value={orgSettings.sickLeaveAllowance}
                onChange={(event) => updateSetting("sickLeaveAllowance", event.target.value)}
              />
            </label>
            <label>
              <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Casual Leave</span>
              <input
                type="number"
                min="0"
                value={orgSettings.casualLeaveAllowance}
                onChange={(event) => updateSetting("casualLeaveAllowance", event.target.value)}
              />
            </label>
            <label>
              <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Annual Leave</span>
              <input
                type="number"
                min="0"
                value={orgSettings.annualLeaveAllowance}
                onChange={(event) => updateSetting("annualLeaveAllowance", event.target.value)}
              />
            </label>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-4 md:items-center">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Payslip Currency</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Select the currency used for generated payslips and salary displays
                </p>
              </div>
              <select
                value={orgSettings.currencyCode || "INR"}
                onChange={(event) => updateCurrency(event.target.value)}
              >
                {currencyOptions.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Annual Leave Payout</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Add money for unused annual leave when generating payslips
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateSetting("annualLeavePayoutEnabled", !orgSettings.annualLeavePayoutEnabled)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${orgSettings.annualLeavePayoutEnabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"}`}
                aria-pressed={orgSettings.annualLeavePayoutEnabled}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${orgSettings.annualLeavePayoutEnabled ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            {orgSettings.annualLeavePayoutEnabled && (
              <label className="block mt-4 max-w-xs">
                <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Amount per unused annual leave</span>
                <input
                  type="number"
                  min="0"
                  value={orgSettings.annualLeavePayoutRate}
                  onChange={(event) => updateSetting("annualLeavePayoutRate", event.target.value)}
                  placeholder="e.g. 500"
                />
              </label>
            )}
          </div>
        </form>
      )}

       {/* Change Password trigger */}
       <div className="card max-w-md p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Lock className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Password</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Update your account password</p>
            </div>
          </div>
          <button onClick={()=> setShowPasswordModal(true)} className="btn-secondary text-sm">
            Change
          </button>
       </div>
       <ChangePasswordModal open={showPasswordModal} onClose={()=> setShowPasswordModal(false)}/>
    </div>
  )
}

export default Settings
