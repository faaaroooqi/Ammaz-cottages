import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../utils/api";
import { AuthContext } from "../../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/auth/login", formData);
      login(res.data.user, res.data.token);
      setLoading(false);

      if (["owner", "staff"].includes(res.data.user.role)) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed ❌");
      setFailedAttempts((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage("");
    setError("");

    try {
      const res = await API.post("/auth/forgot-password", { email: forgotEmail });
      setForgotMessage(res.data.message || "Request sent successfully! Check your email.");
      setForgotEmail("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send request ❌");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900 p-6 relative overflow-hidden">
      {/* Decorative background circles */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="max-w-md w-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 p-10 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 mb-2 tracking-tight">
            {showForgotPassword ? "Reset Password" : "Welcome Back"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">
            {showForgotPassword ? "Enter your email to request a reset link" : "Please enter your details to sign in"}
          </p>
        </div>

        {error && (
          <div className="bg-red-100/80 backdrop-blur border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm text-center font-medium animate-pulse">
            {error}
          </div>
        )}

        {forgotMessage && (
          <div className="bg-green-100/80 backdrop-blur border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 text-sm text-center font-medium">
            {forgotMessage}
          </div>
        )}

        {showForgotPassword ? (
          <form autoComplete="off" onSubmit={handleForgotSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Email</label>
              <input
                type="email"
                placeholder="hello@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full bg-white/70 dark:bg-gray-700/70 border border-gray-200 dark:border-gray-600 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-gray-900 dark:text-white"
                required
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={forgotLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {forgotLoading ? "Submitting..." : "Submit Request"}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotMessage("");
                  setError("");
                }}
                className="text-blue-600 hover:text-blue-800 hover:underline font-bold transition text-sm"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        ) : (
          <form autoComplete="off" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Email</label>
              <input
                type="email"
                name="email"
                placeholder="hello@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white/70 dark:bg-gray-700/70 border border-gray-200 dark:border-gray-600 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-gray-900 dark:text-white"
                required
                autoComplete="off"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
                {failedAttempts >= 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setForgotEmail(formData.email);
                      setError("");
                      setForgotMessage("");
                    }}
                    className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline transition"
                  >
                    🔑 Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-white/70 dark:bg-gray-700/70 border border-gray-200 dark:border-gray-600 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-gray-900 dark:text-white"
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-gray-600 font-medium">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-600 hover:text-blue-800 hover:underline font-bold transition">
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
