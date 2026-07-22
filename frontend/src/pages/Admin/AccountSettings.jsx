import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import API from "../../utils/api";
import { showSuccess, showError } from "../../utils/toast";

function AccountSettings() {
  const { user, login } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await API.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const u = res.data.user;
      setName(u.name || u.username || "");
      setEmail(u.email || "");
      setPhone(u.phone || "");
      login(u, token);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      if (user) {
        setName(user.name || user.username || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
      }
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const payload = { name, email, phone };
      if (password.trim()) payload.password = password;

      const token = localStorage.getItem("token");
      const res = await API.patch(`/auth/me`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      login(res.data.user, token);
      showSuccess("Account settings updated successfully!");
      setPassword("");
    } catch (err) {
      showError(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPic = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.post(`/auth/me/profile-pic`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
      });
      login(res.data.user, token);
      showSuccess("Profile picture updated!");
    } catch (err) {
      showError(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePic = async () => {
    if (!window.confirm("Remove profile picture?")) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.delete(`/auth/me/profile-pic`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      login(res.data.user, token);
      showSuccess("Profile picture removed!");
    } catch (err) {
      showError(err.response?.data?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans">
      <Link to="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition mb-4 font-semibold">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
      </Link>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Account Settings</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your admin profile and security preferences.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        
        {/* Profile Header */}
        <div className="p-8 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <img
              src={user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || user.name || "Admin")}&size=160&background=4f46e5&color=fff&bold=true`}
              alt="Profile"
              className="relative w-32 h-32 rounded-full shadow-lg border-4 border-white dark:border-gray-700 object-cover"
            />
            
            {/* Hover Overlay for Upload/Delete */}
            <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-10">
              <label className="cursor-pointer text-white font-bold text-xs bg-white/20 hover:bg-white/30 transition px-3 py-2 rounded-xl backdrop-blur-sm flex items-center gap-2 shadow-sm">
                <span>📷 Upload</span>
                <input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleUploadPic} disabled={loading} />
              </label>
              {user.profilePic && (
                <button 
                  onClick={handleDeletePic}
                  disabled={loading}
                  className="text-white font-bold text-xs bg-red-500/80 hover:bg-red-500 transition px-3 py-2 rounded-xl backdrop-blur-sm flex items-center gap-2 shadow-sm"
                >
                  <span>🗑️ Remove</span>
                </button>
              )}
            </div>
            <div className="absolute bottom-2 right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white dark:border-gray-800 z-20 pointer-events-none"></div>
          </div>

          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name || user.username}</h3>
            <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
            <span className="inline-block mt-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              {user.role} Role
            </span>
          </div>
        </div>

        {/* Form Fields */}
        <div className="p-8">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Admin Name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="admin@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="+92 300 1234567"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Leave blank to keep current"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-1">Only fill this if you want to change your password.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button
                onClick={handleUpdateProfile}
                disabled={loading}
                className="bg-blue-600 text-white font-bold px-8 py-3 rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {loading ? "Processing..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AccountSettings;
