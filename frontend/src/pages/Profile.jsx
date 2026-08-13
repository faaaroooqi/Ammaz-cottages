import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../utils/api";
import { showSuccess, showError } from "../utils/toast";

function Profile() {
  const { user, login } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || user.username || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const payload = { name, phone };
      if (password.trim()) payload.password = password;

      const token = localStorage.getItem("token");
      const res = await API.patch(`/auth/me`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      login(res.data.user, token);
      showSuccess("Profile updated successfully!");
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-24">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white pt-16 pb-36 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-5xl mx-auto z-10 flex flex-col md:flex-row items-center gap-8">
          
          {/* Avatar Dropzone */}
          <div className="relative group">
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 relative bg-slate-800">
              <img
                src={user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || user.name || "User")}&size=160&background=4f46e5&color=fff&bold=true`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <label className="cursor-pointer text-white text-[10px] font-black uppercase tracking-wider bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl backdrop-blur-md">
                  <span>📷 Photo</span>
                  <input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleUploadPic} disabled={loading} />
                </label>
                {user.profilePic && (
                  <button 
                    onClick={handleDeletePic}
                    disabled={loading}
                    className="text-white text-[10px] font-black uppercase tracking-wider bg-rose-600/80 hover:bg-rose-600 px-3 py-1.5 rounded-xl backdrop-blur-md"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-5 h-5 rounded-full border-4 border-slate-900 z-10" title="Account Verified"></div>
          </div>
          
          {/* User Headline & Badges */}
          <div className="text-center md:text-left space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1 rounded-full">
              <span className="text-indigo-200 text-xs font-black uppercase tracking-wider">Verified {user.role || "Guest"} Account</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              {user.username || user.name || "Guest Account"}
            </h1>
            <p className="text-indigo-200/80 text-sm font-medium">
              {user.email}
            </p>
          </div>

        </div>
      </div>

      {/* Main Settings Box */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Panel - Identity Badges */}
          <div className="md:w-72 bg-slate-50/60 dark:bg-slate-800/40 border-r border-slate-100 dark:border-slate-800 p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Identity Badges</h3>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-3.5 py-2 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/60">
                  <span>✓</span>
                  <span>Email Verified</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-3.5 py-2 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/60">
                  <span>🛡️</span>
                  <span>SSL Security Active</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Member Since</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Resort Guest'}
              </span>
            </div>
          </div>

          {/* Right Panel - Settings Form */}
          <div className="flex-1 p-6 sm:p-10">
            <div className="mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Account & Personal Settings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Update your guest name, contact phone, and security password.</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-3.5 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-semibold transition"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-3.5 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-semibold transition"
                    placeholder="+92 300 1234567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  Email Address (Primary Account Key)
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full border border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 p-3.5 rounded-2xl font-semibold text-sm cursor-not-allowed opacity-80"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">Security & Password</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium">Leave blank if you do not want to alter your password.</p>
                
                <input
                  type="password"
                  placeholder="New password (optional)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full sm:w-1/2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-3.5 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-semibold transition"
                />
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black px-8 py-3.5 rounded-2xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all transform active:scale-95 text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {loading ? "Saving Changes..." : "Save Profile Updates"}
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Profile;

