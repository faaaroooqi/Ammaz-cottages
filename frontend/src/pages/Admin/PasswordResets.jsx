import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPasswordResetRequests, approvePasswordReset } from "../../services/admin.service";
import { showSuccess, showError, showConfirm } from "../../utils/toast";

function PasswordResets() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await getPasswordResetRequests();
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error(err);
      showError("Failed to fetch password reset requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, email) => {
    const ok = await showConfirm(
      `Reset password for ${email}?\n\nThis will set their password to 12345678 and send them an email notification.`
    );
    if (ok) {
      try {
        const res = await approvePasswordReset(requestId);
        showSuccess(res.data.message || "Password reset! Customer notified by email.");
        loadRequests();
      } catch (err) {
        showError(err.response?.data?.message || "Failed to approve reset");
      }
    }
  };

  const filteredRequests = requests.filter(
    (r) =>
      r.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Link to="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition mb-4 font-semibold">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">🔑 Password Reset Requests</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Approve requests to reset a customer's password to a temporary value</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={loadRequests}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-200 transition font-medium border border-gray-300 dark:border-gray-700"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="p-4 font-semibold">Customer</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Requested At</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Resolved Details</th>
                  <th className="p-4 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm text-gray-800 dark:text-gray-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No reset requests found.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="p-4 font-bold">{req.customerName || "Customer"}</td>
                      <td className="p-4 font-medium">{req.email}</td>
                      <td className="p-4 text-gray-500 dark:text-gray-400">
                        {new Date(req.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        {req.status === "resolved" ? (
                          <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-3 py-1 rounded-full text-xs font-bold uppercase">
                            Resolved
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-bold uppercase animate-pulse">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {req.status === "resolved" ? (
                          <div>
                            <p className="font-semibold text-xs">By: {req.resolvedBy?.name || "Admin"}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">
                              {new Date(req.resolvedAt).toLocaleString()}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-600 font-medium text-xs">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleApprove(req._id, req.email)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition shadow ${
                            req.status === "resolved"
                              ? "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {req.status === "resolved" ? "🔄 Re-approve" : "✅ Approve & Reset"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PasswordResets;
