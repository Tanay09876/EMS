import { useEffect, useRef, useState } from "react"
import {Search,AlertCircle, UserCheck} from "lucide-react"
import api from "../api/axios"
import toast from "react-hot-toast"

const RecoverySearchBar = ({deletedEmployees,onRecovered}) => {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [selected, setSelected] = useState(null)
  const [open, setOpen] = useState(false)
  const [recovering, setRecovering] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef(null)
  const boxRef = useRef(null)

  /* Close dropdown */
  useEffect(() => {
    const handler = (e) => {
      if (
        boxRef.current &&
        !boxRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handler)

    return () =>
      document.removeEventListener("mousedown", handler)
  }, [])

  /* Search */
  const handleInput = (val) => {
    setQuery(val)
    setSelected(null)
    setError("")

    if (!val.trim()) {
      setSuggestions([])
      setOpen(false)
      return
    }

    const q = val.trim().toLowerCase()

    const matches = deletedEmployees.filter((emp) => {
      const fullName =
        `${emp.firstName} ${emp.lastName}`.toLowerCase()

      const email =
        (emp.email || "").toLowerCase()

      return (
        fullName.includes(q) ||
        email.includes(q)
      )
    })

    setSuggestions(matches)
    setOpen(matches.length > 0)
  }

  /* Pick */
  const pick = (emp) => {
    setSelected(emp)

    setQuery(
      `${emp.firstName} ${emp.lastName}${
        emp.email ? ` — ${emp.email}` : ""
      }`
    )

    setSuggestions([])
    setOpen(false)
    setError("")
  }

  /* Recover */
  const handleRecover = async () => {
    setError("")

    if (!selected) {
      setError("Please select employee from suggestions.")
      return
    }

    setRecovering(true)

    try {
      await api.patch(`/employees/${selected.id}/recover`)

      toast.success(
        `${selected.firstName} ${selected.lastName} recovered successfully`
      )

      setQuery("")
      setSelected(null)

      onRecovered()
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
        "Failed to recover employee."
      )
    } finally {
      setRecovering(false)
    }
  }

  if (deletedEmployees.length === 0) return null

  return (
 <div ref={boxRef} className=" flex flex-col min-[426px]:flex-row items-stretch min-[426px]:items-center gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input ref={inputRef} type="text" placeholder="Recover deleted employee..." value={query} onChange={(e) => handleInput(e.target.value)} onFocus={() =>
            suggestions.length > 0 && setOpen(true)
          }
          disabled={recovering}
          className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400
          focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"/>

        {/* Dropdown */}
        {open && (
          <ul className="absolute z-50 left-0 right-0 top-[calc(100%+8px)]  bg-white border border-slate-200 rounded-2xl shadow-xl
            overflow-hidden">
            {suggestions.map((emp) => {
              const initials =
                `${emp.firstName[0]}${emp.lastName[0]}`

              return (
                <li key={emp.id}
                  onMouseDown={() => pick(emp)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0">
                  {/* Avatar */}
                  {emp.profileImage ? (
                    <img src={emp.profileImage} alt=""
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-rose-500">
                        {initials}
                      </span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">

                    <p className="text-sm font-medium text-slate-700 truncate">
                      {emp.firstName} {emp.lastName}
                    </p>

                    <p className="text-xs text-slate-400 truncate">
                      {emp.email || "—"} · {emp.department}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* Error */}
        {error && (
          <div className="mt-2 flex items-center gap-2 text-xs text-rose-600">
            <AlertCircle size={12} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Recover Button */}
      <button
        onClick={handleRecover}
        disabled={recovering || !selected}
    className="w-full min-[426px]:w-auto h-11 px-5 rounded-xl btn-primary disabled:bg-emerald-300 disabled:cursor-not-allowed text-white text-sm font-semibold
flex items-center justify-center gap-2 whitespace-nowrap transition-all">
        <UserCheck size={15} />
        {recovering ? "Recovering..." : "Recover"}
      </button>
    </div>
  )
}

export default RecoverySearchBar