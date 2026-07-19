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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans pb-20">
      {/* Header / Hero */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-blue-800 to-blue-900 pt-32 pb-48 px-6 overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-6xl mx-auto z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <img
              src={user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || user.name || "User")}&size=160&background=4f46e5&color=fff&bold=true&font-size=0.4`}
              alt="Profile"
              className="relative w-32 h-32 md:w-40 md:h-40 rounded-3xl shadow-2xl border-4 border-white/10 object-cover"
            />
            
            {/* Hover Overlay for Upload/Delete */}
            <div className="absolute inset-0 bg-black/60 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-10">
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

            <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-indigo-900 z-20 pointer-events-none"></div>
          </div>
          
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 rounded-full mb-4">
              <span className="text-blue-100 text-xs font-bold uppercase tracking-widest">{user.role || "Customer"} Account</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight drop-shadow-md">
              {user.username || user.name || "User"}
            </h1>
            <p className="text-blue-100/80 text-lg font-medium drop-shadow-sm">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="max-w-6xl mx-auto px-6 -mt-24 relative z-20">
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Sidebar / Tabs */}
          <div className="lg:w-72 bg-gray-50/50 dark:bg-gray-800/30 border-r border-gray-100 dark:border-gray-800 p-8">
            <nav className="space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-bold rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal Info
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 font-bold rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Security
              </button>
            </nav>

            <div className="mt-12 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100/50 dark:border-indigo-800/30">
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Member Since</p>
              <p className="text-sm font-extrabold text-gray-800 dark:text-gray-200">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'April 2024'}
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 p-8 md:p-12">
            <div className="mb-10">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Account Settings</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Update your profile information and account security</p>
            </div>

            <div className="space-y-10">
              {/* Group 1: General */}
              <section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none font-semibold shadow-sm"
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none font-semibold shadow-sm"
                      placeholder="+92 300 1234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 dark:text-gray-400 ml-1">Email (Primary)</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full border border-gray-100 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-500 p-4 rounded-2xl font-semibold cursor-not-allowed opacity-80"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full uppercase tracking-tighter">Verified</span>
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-gray-800" />

              {/* Group 2: Security */}
              <section>
                <div className="max-w-md space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Security Update</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">Leave password blank if you don't want to change it</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white p-4 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none font-semibold shadow-sm"
                    />
                  </div>
                </div>
              </section>

              {/* Actions */}
              <div className="pt-8 flex items-center justify-between">
                <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs font-medium">
                  Last updated {new Date().toLocaleDateString()}
                </p>
                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold px-10 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1 active:scale-[0.98] flex items-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      Save Changes
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
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
