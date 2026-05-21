import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEPARTMENTS } from "../assets/assets";
import { Loader2Icon, AlertCircleIcon } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

/* ── Validation Rules ───────────────────────────── */
const validate = (name, value, isEditMode, existingEmails, initialEmail) => {
  switch (name) {
    case "firstName":
      if (!value.trim()) return "First name is required";
      if (value.trim().length < 2) return "Minimum 2 characters required";
      if (!/^[a-zA-Z\s'-]+$/.test(value)) return "Only letters allowed";
      return "";
    case "lastName":
      if (!value.trim()) return "Last name is required";
      if (value.trim().length < 2) return "Minimum 2 characters required";
      if (!/^[a-zA-Z\s'-]+$/.test(value)) return "Only letters allowed";
      return "";
    case "phone":
      if (!value.trim()) return "Phone number is required";
      if (!/^[6-9]\d{9}$/.test(value))
        return "Phone number must contain exactly 10 digits";
      return "";
    case "joinDate":
      if (!value) return "Join date is required";
      if (new Date(value) > new Date())
        return "Join date cannot be future date";
      return "";
    case "bio":
      if (value.length > 300) return "Bio must be under 300 characters";
      return "";
    case "department":
      if (!value) return "Please select department";
      return "";
    case "position":
      if (!value.trim()) return "Position is required";
      if (value.trim().length < 2) return "Minimum 2 characters required";
      return "";
    case "basicSalary":
      if (value === "" || value === null) return "Basic salary is required";
      if (Number(value) < 0) return "Salary cannot be negative";
      return "";
    case "allowances":
      if (value !== "" && value !== undefined && Number(value) < 0) {
        return "Allowances cannot be negative";
      }
      return "";

    case "deductions":
      if (value !== "" && value !== undefined && Number(value) < 0) {
        return "Deductions cannot be negative";
      }
      return "";
    case "email": {
      if (!value.trim()) return "Email address is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return "Enter a valid email address";
      const lowerEmail = value.trim().toLowerCase();
      if (lowerEmail !== initialEmail?.toLowerCase()) {
        if (existingEmails.includes(lowerEmail)) {
          return "Email already exists";
        }
      }
      return "";
    }
    case "password":
      if (!isEditMode && !value) return "Password is required";
      if (value && value.length < 6) return "Minimum 6 characters required";
      if (value && !/[A-Z]/.test(value)) return "One uppercase letter required";
      if (value && !/[a-z]/.test(value)) return "One lowercase letter required";
      if (value && !/[0-9]/.test(value)) return "One number required";
      return "";
    default:
      return "";
  }
};

const blockInvalidChars = (e) => {
  if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E") {
    e.preventDefault();
  }
};

/* ── Error Component ───────────────────────────── */
const FieldError = ({ message }) => {
  if (!message) return null;
  return (
    <div className=" flex items-start gap-1.5 mt-2 text-sm sm:text-[15px]  text-rose-500 leading-5">
      <AlertCircleIcon size={15} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
};

/* ── Main Component ───────────────────────────── */
const EmployeeForm = ({ initialData, onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [existingEmails, setExistingEmails] = useState([]);
  const isEditMode = !!initialData;
  /* Fetch Existing Emails */
  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const res = await api.get("/employees");
        const emails = res.data.map((emp) => emp.email?.toLowerCase());
        setExistingEmails(emails);
      } catch (error) {
        console.log(error);
      }
    };
    fetchEmails();
  }, []);
  /* Change Handler */
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validate(
          name,
          value,
          isEditMode,
          existingEmails,
          initialData?.email,
        ),
      }));
    }
  };
  /* Blur Handler */
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: validate(
        name,
        value,
        isEditMode,
        existingEmails,
        initialData?.email,
      ),
    }));
  };
  /* Validate All */
  const validateAll = (formData) => {
    const fields = [
      "firstName",
      "lastName",
      "phone",
      "joinDate",
      "bio",
      "department",
      "position",
      "basicSalary",
      "allowances",
      "deductions",
      "email",
    ];
    if (!isEditMode) {
      fields.push("password");
    } else {
      const pwd = formData.get("password");
      if (pwd) fields.push("password");
    }
    const newErrors = {};
    const newTouched = {};
    fields.forEach((field) => {
      const value = formData.get(field) || "";
      newTouched[field] = true;
      const err = validate(
        field,
        value,
        isEditMode,
        existingEmails,
        initialData?.email,
      );
      if (err) newErrors[field] = err;
    });
    setTouched(newTouched);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  /* Submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!validateAll(formData)) {
      return;
    }
    setLoading(true);
    if (isEditMode) {
      const pwd = formData.get("password");
      if (!pwd) formData.delete("password");
    }
    try {
      const url = isEditMode ? `/employees/${initialData.id}` : "/employees";
      const method = isEditMode ? "put" : "post";
      await api[method](url, formData);
      toast.success(
        isEditMode
          ? "Employee updated successfully"
          : "Employee created successfully",
      );
      onSuccess ? onSuccess() : navigate("/employees");
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };
  /* Field Helper */
  const field = (name) => ({
    name,
    onChange: handleChange,
    onBlur: handleBlur,
    className:
      errors[name] && touched[name]
        ? "border-rose-400 focus:ring-rose-100 focus:border-rose-400"
        : "",
  });
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-3xl animate-fade-in"
      noValidate
    >
      {/* Personal Info */}
      <div className="card p-5 sm:p-6">
        <h3 className="font-medium mb-6 pb-4 border-b border-slate-100">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-700">
          {/* First Name */}
          <div>
            <label className="block mb-2">
              First Name
              <span className="text-red-500">*</span>
            </label>
            <input
              {...field("firstName")}
              defaultValue={initialData?.firstName}
            />
            <FieldError message={touched.firstName && errors.firstName} />
          </div>
          {/* Last Name */}
          <div>
            <label className="block mb-2">
              Last Name
              <span className="text-red-500">*</span>
            </label>
            <input
              {...field("lastName")}
              defaultValue={initialData?.lastName}
            />
            <FieldError message={touched.lastName && errors.lastName} />
          </div>
          {/* Phone */}
          <div>
            <label className="block mb-2">
              Phone Number
              <span className="text-red-500">*</span>
            </label>
            <input
              {...field("phone")}
              maxLength={10}
              defaultValue={initialData?.phone}
            />
            <FieldError message={touched.phone && errors.phone} />
          </div>
          {/* Join Date */}
          <div>
            <label className="block mb-2">
              Join Date
              <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...field("joinDate")}
              defaultValue={
                initialData?.joinDate
                  ? new Date(initialData.joinDate).toISOString().split("T")[0]
                  : ""
              }
            />
            <FieldError message={touched.joinDate && errors.joinDate} />
          </div>
          {/* Bio */}
          <div className="sm:col-span-2">
            <label className="block mb-2">
              Bio
              <span className="ml-1 text-xs text-slate-400 font-normal">
                (optional)
              </span>
            </label>
            <textarea
              {...field("bio")}
              rows={3}
              className={`resize-none ${errors.bio && touched.bio ? "border-rose-400" : ""}`}
              defaultValue={initialData?.bio}
              placeholder="Brief description..."
            />
            <FieldError message={touched.bio && errors.bio} />
          </div>
        </div>
      </div>
      {/* Employment */}
      <div className="card p-5 sm:p-6">
        <h3 className="text-base font-medium text-slate-900 mb-6 pb-4 border-b border-slate-100">
          Employment Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-700">
          {/* Department */}
          <div>
            <label className="block mb-2">
              Department
              <span className="text-red-500">*</span>
            </label>
            <select
              {...field("department")}
              defaultValue={initialData?.department || ""}
            >
              <option value="">Select Department</option>

              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <FieldError message={touched.department && errors.department} />
          </div>

          {/* Position */}
          <div>
            <label className="block mb-2">
              Position
              <span className="text-red-500">*</span>
            </label>

            <input
              {...field("position")}
              defaultValue={initialData?.position}
            />

            <FieldError message={touched.position && errors.position} />
          </div>

          {/* Salary */}
          <div>
            <label className="block mb-2">
              Basic Salary
              <span className="text-red-500">*</span>
            </label>

            <input
              type="number"
              {...field("basicSalary")}
              min="0"
              step="0.01"
              defaultValue={initialData?.basicSalary || 0}
            />

            <FieldError message={touched.basicSalary && errors.basicSalary} />
          </div>

          {/* Allowances */}
          <div>
            <label className="block mb-2">
              Allowances
              <span className="ml-1 text-xs text-slate-400 font-normal">
                (optional)
              </span>
            </label>

            <input
              type="number"
              {...field("allowances")}
              min="0"
              step="0.01"
              defaultValue={initialData?.allowances || ""}
              onKeyDown={blockInvalidChars}
            />

            <FieldError message={touched.allowances && errors.allowances} />
          </div>

          {/* Deductions */}
          <div>
            <label className="block mb-2">
              Deductions
              <span className="ml-1 text-xs text-slate-400 font-normal">
                (optional)
              </span>
            </label>

            <input
              type="number"
              {...field("deductions")}
              min="0"
              step="0.01"
              defaultValue={initialData?.deductions || ""}
              onKeyDown={blockInvalidChars}
            />

            <FieldError message={touched.deductions && errors.deductions} />
          </div>

          {/* Status */}
          {isEditMode && (
            <div>
              <label className="block mb-2">
                Status
                <span className="text-red-500">*</span>
              </label>

              <select
                name="employmentStatus"
                defaultValue={initialData?.employmentStatus}
              >
                <option value="ACTIVE">Active</option>

                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Account */}
      <div className="card p-5 sm:p-6">
        <h3 className="text-base font-medium text-slate-900 mb-6 pb-4 border-b border-slate-100">
          Account Setup
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-700">
          {/* Email */}
          <div className="sm:col-span-2">
            <label className="block mb-2">
              Work Email
              <span className="text-red-500">*</span>
            </label>

            <input
              type="email"
              {...field("email")}
              defaultValue={initialData?.email}
            />

            <FieldError message={touched.email && errors.email} />
          </div>

          {/* Password */}
          <div>
            <label className="block mb-2">
              {isEditMode ? "Change Password" : "Temporary Password"}
              <span className="text-red-500">*</span>
            </label>

            <input
              type="password"
              {...field("password")}
              placeholder={isEditMode ? "Leave blank to keep current" : ""}
            />

            <FieldError message={touched.password && errors.password} />
          </div>

          {/* Role */}
          <div>
            <label className="block mb-2">
              System Role
              <span className="text-red-500">*</span>
            </label>

            <select
              name="role"
              defaultValue={initialData?.user?.role || "EMPLOYEE"}
            >
              <option value="EMPLOYEE">Employee</option>

              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => (onCancel ? onCancel() : navigate(-1))}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex items-center justify-center"
        >
          {loading && <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />}

          {isEditMode ? "Update Employee" : "Create Employee"}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;

// import { useState } from "react"
// import { useNavigate } from "react-router-dom"
// import { DEPARTMENTS } from "../assets/assets"
// import { Loader2Icon } from "lucide-react"
// import api from "../api/axios"
// import toast from "react-hot-toast"

// const EmployeeForm = ({initialData, onSuccess, onCancel}) => {
//     const navigate = useNavigate()
//     const [loading, setLoading] = useState(false)
//     const isEditMode = !!initialData;

//     const handleSubmit = async (e)=>{
//         e.preventDefault()
//         setLoading(true)
//         const formData = new FormData(e.currentTarget);
//         if(isEditMode){
//             const pwd = formData.get("password")
//             if(!pwd) formData.delete("password")
//         }

//         try {
//             const url = isEditMode ? `/employees/${initialData.id}` : "/employees";
//             const method = isEditMode ? "put" : "post";
//             await api[method](url, formData)
//             onSuccess ? onSuccess() : navigate("/employees")
//         } catch (error) {
//             toast.error(error.response?.data?.error || error.message);
//         }finally{
//             setLoading(false);
//         }
//     }

//   return (
//     <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl animate-fade-in">

//         {/* Personal Information */}
//         <div className="card p-5 sm:p-6">
//             <h3 className="font-medium mb-6 pb-4 border-b border-slate-100">Personal Information</h3>
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-700">
//                 <div>
//                     <label className="block mb-2">First Name</label>
//                     <input name="firstName" required defaultValue={initialData?.firstName} />
//                 </div>
//                 <div>
//                     <label className="block mb-2">Last Name</label>
//                     <input name="lastName" required defaultValue={initialData?.lastName} />
//                 </div>
//                 <div>
//                     <label className="block mb-2">Phone Number</label>
//                     <input name="phone" required defaultValue={initialData?.phone} />
//                 </div>
//                 <div>
//                     <label className="block mb-2">Join Date</label>
//                     <input type="date" name="joinDate" required defaultValue={initialData?.joinDate ? new Date(initialData.joinDate).toISOString().split("T")[0] : ""} />
//                 </div>
//                 <div className="sm:col-span-2">
//                     <label className="block mb-2">Bio (Optional)</label>
//                     <textarea name="bio" defaultValue={initialData?.bio} rows={3} className="resize-none" placeholder="Brief description..."/>
//                 </div>
//             </div>

//         </div>

//         {/* Employment Details */}
//         <div className="card p-5 sm:p-6">
//             <h3 className="text-base font-medium text-slate-900 mb-6 pb-4 border-b border-slate-100">Employment Details</h3>
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-700">
//                 <div>
//                     <label className="block mb-2">Department</label>
//                     <select name="department" defaultValue={initialData?.department || ""}>
//                         <option value="">Select Department</option>
//                         {DEPARTMENTS.map((deptName)=>(
//                             <option key={deptName} value={deptName}>
//                                     {deptName}
//                                 </option>
//                         ))}
//                     </select>
//                 </div>
//                 <div>
//                     <label className="block mb-2">Position</label>
//                     <input name="position" required defaultValue={initialData?.position} />
//                 </div>
//                 <div>
//                     <label className="block mb-2">Basic Salary</label>
//                     <input type="number" name="basicSalary" required min="0" step="0.01" defaultValue={initialData?.basicSalary || 0} />
//                 </div>
//                 <div>
//                     <label className="block mb-2">Allowances</label>
//                     <input type="number" name="allowances" min="0" step="0.01" required defaultValue={initialData?.allowances || 0} />
//                 </div>
//                 <div>
//                     <label className="block mb-2">Deductions</label>
//                     <input type="number" name="deductions" min="0" step="0.01" required defaultValue={initialData?.deductions || 0} />
//                 </div>
//                 {isEditMode && (
//                     <div>
//                     <label className="block mb-2">Status</label>
//                     <select name="employmentStatus" defaultValue={initialData?.employmentStatus}>
//                         <option value="ACTIVE">Active</option>
//                         <option value="INACTIVE">Inactive</option>
//                     </select>
//                 </div>
//                 )}
//             </div>
//         </div>

//         {/* Account Setup */}
//          <div className="card p-5 sm:p-6">
//             <h3 className="text-base font-medium text-slate-900 mb-6 pb-4 border-b border-slate-100">Account Setup</h3>
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-700">
//                 <div className="sm:col-span-2">
//                     <label className="block mb-2">Work Email</label>
//                     <input type="email" name="email" required defaultValue={initialData?.email} />
//                 </div>
//                 {!isEditMode && (
//                     <div>
//                         <label className="block mb-2">Temporary Password</label>
//                         <input type="password" name="password" required />
//                     </div>
//                 )}
//                 {isEditMode && (
//                     <div>
//                         <label className="block mb-2">Change Password (Optional)</label>
//                         <input type="password" name="password" placeholder="Leave blank to keep current" />
//                     </div>
//                 )}
//                 <div>
//                         <label className="block mb-2">System Role</label>
//                         <select name="role" defaultValue={initialData?.user?.role || "EMPLOYEE"}>
//                             <option value="EMPLOYEE">Employee</option>
//                             <option value="ADMIN">Admin</option>
//                         </select>
//                     </div>

//             </div>

//         </div>

//          {/* buttons  */}
//          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
//             <button type="button" className="btn-secondary" onClick={()=>(onCancel ? onCancel() : navigate(-1))}>
//                 Cancel
//             </button>
//             <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center">
//                 {loading && <Loader2Icon className="w-4 h-4 mr-2 animate-spin"/>}
//                 {isEditMode ? "Update Employee" : "Create Employee"}
//             </button>

//          </div>

//     </form>
//   )
// }

// export default EmployeeForm
