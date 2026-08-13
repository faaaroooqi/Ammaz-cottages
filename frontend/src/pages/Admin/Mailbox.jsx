import { useEffect, useState } from "react";
import { getEmailLogs, resendEmailLog } from "../../services/admin.service";
import { showError, showSuccess } from "../../utils/toast";

function Mailbox() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [statusFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const res = await getEmailLogs(params);
      const emailLogs = res.data.emailLogs || [];
      setLogs(emailLogs);
      
      if (emailLogs.length > 0) {
        setSelectedLog((prev) => emailLogs.find(l => l._id === prev?._id) || emailLogs[0]);
      } else {
        setSelectedLog(null);
      }
    } catch (err) {
      console.error(err);
      showError("Failed to fetch email logs");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!selectedLog) return;
    setResending(true);
    try {
      await resendEmailLog(selectedLog._id);
      showSuccess("Email resent successfully!");
      fetchLogs();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to resend email");
    } finally {
      setResending(false);
    }
  };


  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  // Filter logs locally based on selected status filter
  const filteredLogs = logs.filter((log) => {
    if (statusFilter === "all") return true;
    return log.status === statusFilter;
  });

  return (
    <div className="flex h-[calc(100vh-70px)] bg-gray-50 dark:bg-gray-950 overflow-hidden font-sans">
      {/* ── Left Pane: Email Logs List ── */}
      <div className="w-full md:w-96 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900 shrink-0">
        {/* Search & Filter Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
          <h2 className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2">
            📬 Outbox Mailbox
          </h2>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Search recipient or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm"
            >
              Search
            </button>
          </form>
          
          {/* Status Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl gap-1">
            {["all", "success", "failed"].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                  statusFilter === tab
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Logs List Container */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 px-4 text-gray-400">
              <p className="text-3xl mb-2">✉️</p>
              <p className="text-sm font-semibold">No emails sent yet</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log._id}
                onClick={() => setSelectedLog(log)}
                className={`p-4 cursor-pointer transition-all border-l-4 ${
                  selectedLog?._id === log._id
                    ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-600"
                    : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/40"
                }`}
              >
                <div className="flex justify-between items-start mb-1 gap-2">
                  <p className="text-xs font-extrabold text-gray-800 dark:text-gray-200 truncate">
                    {log.to}
                  </p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      log.status === "success"
                        ? "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400"
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 mb-1">
                  {log.subject}
                </h4>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                  {new Date(log.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Right Pane: Email Detail Viewer ── */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
        {selectedLog ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900 m-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
            {/* Header Details */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex justify-between items-start gap-4">
                <h1 className="text-lg md:text-xl font-black text-gray-900 dark:text-white">
                  {selectedLog.subject}
                </h1>
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {resending ? "Resending..." : "🔄 Resend Email"}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <div>
                  <span className="text-gray-400 dark:text-gray-500 font-semibold block uppercase tracking-wider text-[10px]">
                    Recipient
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white font-mono">
                    {selectedLog.to}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-gray-500 font-semibold block uppercase tracking-wider text-[10px]">
                    Sent At
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </span>
                </div>
                {selectedLog.status === "failed" && selectedLog.errorMessage && (
                  <div className="w-full bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-xl border border-red-100 dark:border-red-900/30 flex gap-2">
                    <span>❌</span>
                    <div>
                      <span className="font-bold">Error Message:</span> {selectedLog.errorMessage}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sandbox Render Iframe Container */}
            <div className="flex-1 bg-gray-100 dark:bg-gray-950 p-6 flex flex-col overflow-hidden">
              <span className="text-gray-400 dark:text-gray-500 font-semibold block uppercase tracking-wider text-[10px] mb-2">
                Live HTML Sandbox Preview
              </span>
              <div className="flex-1 bg-white rounded-xl shadow-inner border border-gray-200 dark:border-gray-800 overflow-hidden relative">
                <iframe
                  title="Email Preview"
                  srcDoc={selectedLog.html}
                  className="w-full h-full border-none bg-white"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-center p-8">
            <span className="text-6xl mb-4">📬</span>
            <h3 className="text-lg font-extrabold text-gray-800 dark:text-white">
              No email selected
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
              Select an email from the left sidebar to preview the exact content sent to customer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Mailbox;
