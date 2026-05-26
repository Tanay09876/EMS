import { useEffect, useState } from "react";
import { Loader2Icon, MessageSquareWarningIcon, SendIcon } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import Loading from "../components/Loading";
import { useAuth } from "../context/AuthContext";

const statusOptions = [
  { value: "OPEN", label: "Open" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "RESOLVED", label: "Resolved" },
];

const statusClass = {
  OPEN: "badge-danger",
  IN_REVIEW: "badge-warning",
  RESOLVED: "badge-success",
};

const Messages = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState({ subject: "", message: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchMessages = () => {
    setLoading(true);
    api
      .get("/messages")
      .then((res) => setMessages(res.data.data || []))
      .catch((error) => toast.error(error?.response?.data?.error || error?.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMessages();
  }, []);

  const submitIssue = async (event) => {
    event.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error("Subject and message are required");
      return;
    }

    try {
      setSaving(true);
      await api.post("/messages", form);
      setForm({ subject: "", message: "" });
      toast.success("Issue submitted");
      fetchMessages();
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message);
    } finally {
      setSaving(false);
    }
  };

  const updateMessage = async (message, updates) => {
    try {
      await api.patch(`/messages/${message.id || message._id}`, updates);
      fetchMessages();
      toast.success("Message updated");
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message);
    }
  };

  if (loading && !messages.length) return <Loading />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">{isAdmin ? "Employee Issues" : "Messages"}</h1>
        <p className="page-subtitle">
          {isAdmin ? "Review issues raised by employees" : "Raise an issue for the admin team"}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.2fr] gap-6">
        {!isAdmin && (
          <form onSubmit={submitIssue} className="card p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <MessageSquareWarningIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Raise Issue</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Admin will see it here</p>
              </div>
            </div>
            <input
              value={form.subject}
              onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
              placeholder="Subject"
            />
            <textarea
              rows={6}
              value={form.message}
              onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
              placeholder="Describe the issue"
            />
            <button type="submit" disabled={saving} className="btn-primary inline-flex items-center justify-center gap-2 w-full sm:w-auto">
              {saving ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
              Submit
            </button>
          </form>
        )}

        <div className={`card overflow-hidden ${isAdmin ? "xl:col-span-2" : ""}`}>
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Issue List</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{messages.length} total</p>
            </div>
            {loading && <Loader2Icon className="w-4 h-4 text-slate-400 animate-spin" />}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {messages.map((item) => (
              <div key={item.id || item._id} className="p-5 sm:p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{item.subject}</h4>
                    {isAdmin && item.employee && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {item.employee.firstName} {item.employee.lastName} • {item.employee.department || "No department"}
                      </p>
                    )}
                  </div>
                  <span className={`badge ${statusClass[item.status] || ""}`}>{statusOptions.find((option) => option.value === item.status)?.label || item.status}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap mb-4">{item.message}</p>
                {item.adminReply && (
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 mb-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Admin reply</p>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{item.adminReply}</p>
                  </div>
                )}
                {isAdmin && (
                  <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-3">
                    <select
                      defaultValue={item.status}
                      onChange={(event) => updateMessage(item, { status: event.target.value })}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <input
                      defaultValue={item.adminReply || ""}
                      onBlur={(event) => updateMessage(item, { adminReply: event.target.value })}
                      placeholder="Admin reply"
                    />
                    <button
                      type="button"
                      onClick={() => updateMessage(item, { status: "RESOLVED", adminReply: item.adminReply || "" })}
                      className="btn-secondary"
                    >
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            ))}
            {!messages.length && (
              <div className="p-12 text-center text-slate-400">No messages yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
