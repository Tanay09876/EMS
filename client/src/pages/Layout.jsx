import { useEffect, useState } from "react"
import { Navigate, Outlet } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import { useAuth } from "../context/AuthContext"
import Loading from "../components/Loading"


const Layout = () => {
  const {user, loading} = useAuth()
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light")

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    localStorage.setItem("theme", theme)
  }, [theme])

  if(loading) return <Loading />
  if(!user) return <Navigate to="/login" />
 
  return (
    <div className="flex h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <Sidebar theme={theme} onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")} />
        <main className="flex-1 overflow-y-auto">
            <div className="p-4 pt-16 sm:p-6 sm:pt-6 lg:p-8 max-w-400 mx-auto">
                <Outlet />
            </div>
        </main>
    </div>
  )
}

export default Layout
