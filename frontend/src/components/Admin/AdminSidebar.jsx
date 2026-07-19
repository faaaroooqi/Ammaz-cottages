import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

function AdminSidebar({ onClose }) {
  const { logout, user, theme, setTheme } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="w-64 bg-gray-900 text-white h-screen p-6 flex flex-col">
      <div className="mb-8 border-b border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-blue-400">Admin Portal</h2>
        {user && <p className="text-sm text-gray-400 mt-1">Logged in as {user.username}</p>}
      </div>

      <nav className="flex flex-col gap-4 flex-1">
        <Link to="/admin" onClick={onClose} className="hover:text-blue-400 transition">📊 Dashboard</Link>
        <Link to="/admin/bookings" onClick={onClose} className="hover:text-blue-400 transition">🧾 Manage Bookings</Link>
        <Link to="/admin/rooms" onClick={onClose} className="hover:text-blue-400 transition">🛏️ Manage Rooms</Link>
        <Link to="/admin/reports" onClick={onClose} className="hover:text-blue-400 transition">📈 Reports</Link>
        <Link to="/admin/customers" onClick={onClose} className="hover:text-blue-400 transition">👥 Customer Details</Link>
        <Link to="/admin/password-resets" onClick={onClose} className="hover:text-blue-400 transition">🔑 Reset Requests</Link>
        <Link to="/admin/reviews" onClick={onClose} className="hover:text-blue-400 transition">⭐ Customer Reviews</Link>
        <Link to="/admin/mailbox" onClick={onClose} className="hover:text-blue-400 transition">📬 Outbox Mailbox</Link>
        <Link to="/admin/payment-options" onClick={onClose} className="hover:text-blue-400 transition">💳 Payment Options</Link>
        <Link to="/admin/trash" onClick={onClose} className="hover:text-red-400 transition">🗑️ Trash</Link>
        <Link to="/admin/settings" onClick={onClose} className="hover:text-blue-400 transition mt-4 pt-4 border-t border-gray-700">⚙️ Account Settings</Link>
      </nav>

      <div className="mt-auto border-t border-gray-700 pt-4 space-y-4">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between bg-gray-800 p-2 rounded-lg">
          <span className="text-sm font-medium text-gray-300">Theme</span>
          <div className="flex bg-gray-900 rounded-md p-1">
            <button
              onClick={() => setTheme("light")}
              className={`px-3 py-1 rounded text-xs font-bold transition ${theme !== "dark" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"}`}
            >
              ☀️
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`px-3 py-1 rounded text-xs font-bold transition ${theme === "dark" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"}`}
            >
              🌙
            </button>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full text-left py-2 text-red-400 hover:text-red-300 transition font-bold"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

export default AdminSidebar;