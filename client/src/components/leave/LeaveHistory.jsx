import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import api from "../../api/axios";
import toast from "react-hot-toast";

const LeaveHistory = ({ leaves, isAdmin, onUpdate }) => {
  const [processing, setProcessing] = useState(null);
  const [rejectLeave, setRejectLeave] = useState(null);
  const [adminRemark, setAdminRemark] = useState("");

  const handleStatusUpdate = async (id, status, remark = "") => {
    setProcessing(id);
    try {
      await api.patch(`/leave/${id}`, { status, adminRemark: remark });
      toast.success(
        status === "APPROVED" ? "Leave approved" : "Leave rejected",
      );
      setRejectLeave(null);
      setAdminRemark("");
      onUpdate();
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message);
    } finally {
      setProcessing(null);
    }
  };
  return (
    <>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                {isAdmin && <th>Employee</th>}
                <th>Type</th>
                <th>Dates</th>
                <th>Reason</th>
                <th>Status</th>
                {isAdmin && <th className="text-center">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 6 : 4}
                    className="text-center py-12 text-slate-400"
                  >
                    No leave applications found
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => {
                  return (
                    <tr key={leave._id || leave.id}>
                      {isAdmin && (
                        <td className="text-slate-900">
                          {leave.employee?.firstName} {leave.employee?.lastName}
                        </td>
                      )}

                      <td>
                        <span className="badge bg-slate-100 text-slate-600">
                          {leave.type}
                        </span>
                      </td>

                      <td className="text-xs text-slate-500">
                        {format(new Date(leave.startDate), "MMM dd")} -{" "}
                        {format(new Date(leave.endDate), "MMM dd, yyyy")}
                      </td>

                      {/* <td className='max-w-xs truncate text-slate-500' title={leave.reason}>
                                            <div className='truncate'>{leave.reason}</div>
                                            {leave.adminRemark && (
                                                <div className='text-xs text--500 truncate mt-1' title={leave.adminRemark}>
                                                    Admin: {leave.adminRemark}
                                                </div>
                                            )}
                                        </td> */}
                      <td className="max-w-xs text-slate-500">
                        {/* Leave Reason */}
                        <div className="relative group">
                          <div className="truncate cursor-pointer max-w-xs">
                            {leave.reason}
                          </div>

                          <div className="absolute left-0 top-7 hidden group-hover:block z-50 bg-white border border-gray-200 shadow-lg rounded-md p-2 w-max max-w-sm text-sm text-gray-700 whitespace-normal wrap-break-words">
                            {leave.reason}
                          </div>
                        </div>

                        {/* Admin Remark */}
                        {leave.adminRemark && (
                          <div className="relative group mt-1">
                            <div className="text-xs text-black truncate cursor-pointer max-w-xs">
                              Admin: {leave.adminRemark}
                            </div>

                            <div className="absolute left-0 top-6 hidden group-hover:block z-50 bg-white border border-gray-200 shadow-lg rounded-md p-2 w-max max-w-sm text-sm text-gray-700 whitespace-normal wrap-break-words">
                              {leave.adminRemark}
                            </div>
                          </div>
                        )}
                      </td>

                      <td>
                        <span
                          className={`badge ${leave.status === "APPROVED" ? "badge-success" : leave.status === "REJECTED" ? "badge-danger" : "badge-warning"}`}
                        >
                          {leave.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td>
                          {leave.status === "PENDING" && (
                            <div className="flex justify-center gap-2">
                              <button
                                disabled={!!processing}
                                onClick={() =>
                                  handleStatusUpdate(
                                    leave._id || leave.id,
                                    "APPROVED",
                                  )
                                }
                                className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                              >
                                {processing === (leave._id || leave.id) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </button>

                              <button
                                onClick={() => setRejectLeave(leave)}
                                disabled={!!processing}
                                className="p-1.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                              >
                                {processing === (leave._id || leave.id) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <X className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {rejectLeave && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!adminRemark.trim()) {
                toast.error("Please add rejection reason");
                return;
              }
              handleStatusUpdate(
                rejectLeave._id || rejectLeave.id,
                "REJECTED",
                adminRemark.trim(),
              );
            }}
            className="card w-full max-w-md p-5 sm:p-6 shadow-2xl animate-slide-up"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-slate-900">
                  Reject Leave
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {rejectLeave.employee?.firstName}{" "}
                  {rejectLeave.employee?.lastName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRejectLeave(null)}
                className="p-2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason
            </label>
            <textarea
              value={adminRemark}
              onChange={(e) => setAdminRemark(e.target.value)}
              rows={4}
              required
              maxLength={300}
              className="resize-none"
              placeholder="Explain why this leave is not approved..."
            />
            <p className="text-xs text-slate-400 mt-1">
              {adminRemark.length}/300
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setRejectLeave(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!!processing}
                className="btn-primary flex items-center justify-center gap-2"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Reject
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default LeaveHistory;
