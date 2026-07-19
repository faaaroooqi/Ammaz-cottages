import { useState, useContext, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../../utils/api";
import { AuthContext } from "../../context/AuthContext";

/* ─── Provider colour map ──────────────────────────────────────────── */
const PROVIDER_COLORS = {
  EasyPaisa: { bg: "bg-green-50",  border: "border-green-200",  title: "text-green-800"  },
  JazzCash:  { bg: "bg-red-50",    border: "border-red-200",    title: "text-red-800"    },
  SadaPay:   { bg: "bg-violet-50", border: "border-violet-200", title: "text-violet-800" },
  NayaPay:   { bg: "bg-orange-50", border: "border-orange-200", title: "text-orange-800" },
};
const DEFAULT_WALLET = { bg: "bg-teal-50", border: "border-teal-200", title: "text-teal-800" };
const DEFAULT_BANK   = { bg: "bg-blue-50", border: "border-blue-200", title: "text-blue-800" };

function getColor(opt) {
  if (opt.type === "mobile_wallet") return PROVIDER_COLORS[opt.provider] || DEFAULT_WALLET;
  return DEFAULT_BANK;
}

function PaymentPending() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useContext(AuthContext);
  const fileInputRef = useRef(null);

  const booking = location.state?.booking;
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Dynamic payment options
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  useEffect(() => {
    API.get("/payment-options")
      .then((res) => setPaymentOptions(res.data.paymentOptions || []))
      .catch(() => setPaymentOptions([]))
      .finally(() => setOptionsLoading(false));
  }, []);

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-12 rounded-3xl shadow-sm border border-gray-100 max-w-md">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold mb-3 text-gray-800">No Booking Found</h2>
          <p className="text-gray-500 mb-6">The booking details could not be loaded.</p>
          <button
            onClick={() => navigate("/my-bookings")}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
          >
            Go to My Bookings
          </button>
        </div>
      </div>
    );
  }

  const selectFile = (selectedFile) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(selectedFile.type)) {
      setError("Only JPEG, PNG, and WebP images are allowed.");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be under 5 MB.");
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setError("");
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) selectFile(e.target.files[0]);
  };

  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) selectFile(e.dataTransfer.files[0]);
  };

  const removeFile = () => { setFile(null); setPreview(null); };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { setError("Please select a screenshot to upload."); return; }

    const formData = new FormData();
    formData.append("screenshot", file);

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await API.post(`/bookings/${booking._id}/screenshot`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage("Screenshot uploaded successfully! Awaiting admin verification.");
      setTimeout(() => navigate("/my-bookings"), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to upload screenshot.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <button
          onClick={() => navigate("/my-bookings")}
          className="flex items-center text-gray-500 hover:text-blue-600 font-medium transition mb-6"
        >
          <span className="mr-2">←</span> Back to My Bookings
        </button>

        {/* Header Card */}
        <div className="bg-gradient-to-r from-indigo-900 to-blue-900 text-white rounded-t-3xl p-8 shadow-lg">
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">Complete Your Payment</h2>
          <p className="text-blue-200 font-medium">Upload a screenshot of your payment to confirm your booking</p>

          <div className="flex flex-wrap gap-6 mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
            <div>
              <span className="text-blue-200 text-xs font-semibold uppercase">Booking ID</span>
              <p className="font-bold text-lg">{booking.bookingId}</p>
            </div>
            <div>
              <span className="text-blue-200 text-xs font-semibold uppercase">Total Amount</span>
              <p className="font-extrabold text-2xl">PKR {booking.totalAmount}</p>
            </div>
          </div>
        </div>

        {/* Payment Methods — Dynamic */}
        <div className="bg-white border-x border-gray-200 p-8">
          <h3 className="text-xl font-bold mb-2 text-gray-800">Payment Methods</h3>
          <p className="text-gray-500 mb-5 text-sm">
            Transfer the exact amount using any method below, then upload your transaction screenshot.
          </p>

          {optionsLoading ? (
            /* Loading skeleton */
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-100 rounded-2xl p-5 animate-pulse space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-5 bg-gray-200 rounded w-1/2 mt-2" />
                </div>
              ))}
            </div>
          ) : paymentOptions.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
              <div className="text-3xl mb-2">💳</div>
              <p className="text-gray-500 font-medium text-sm">
                No payment methods available at the moment. Please contact the guest house directly.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentOptions.map((opt) => {
                const col = getColor(opt);
                return (
                  <div
                    key={opt._id}
                    className={`${col.bg} p-5 rounded-2xl border ${col.border} shadow-sm`}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-sm">{opt.type === "mobile_wallet" ? "📱" : "🏦"}</span>
                      <h4 className={`font-bold text-sm uppercase tracking-wider ${col.title}`}>
                        {opt.provider}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-600">{opt.accountTitle}</p>
                    <p className="font-mono text-lg mt-2 font-bold text-gray-900 break-all">
                      {opt.accountNumber}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="bg-white border border-gray-200 rounded-b-3xl p-8 shadow-sm">
          <h3 className="text-xl font-bold mb-5 text-gray-800">Upload Payment Screenshot</h3>

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl mb-5 flex items-center gap-3 shadow-sm">
              <span className="text-xl">✅</span>
              <p className="font-semibold text-sm">{message}</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-5 flex items-center gap-3 shadow-sm">
              <span className="text-xl">⚠️</span>
              <p className="font-semibold text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleUpload}>
            {/* Preview or Drop Zone */}
            {preview ? (
              <div className="relative mb-5">
                <div className="border-2 border-green-300 rounded-2xl overflow-hidden bg-gray-50 p-3">
                  <img
                    src={preview}
                    alt="Receipt preview"
                    className="max-h-64 mx-auto rounded-xl object-contain shadow-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute top-4 right-4 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold hover:bg-red-700 shadow-lg transition"
                >
                  ✕
                </button>
                <p className="text-center text-sm text-gray-500 mt-2 font-medium">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all mb-5 ${
                  isDragging
                    ? "border-blue-500 bg-blue-50 scale-[1.01]"
                    : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="text-4xl mb-3">📸</div>
                <p className="text-base font-bold text-gray-700 mb-1">
                  {isDragging ? "Drop your screenshot here!" : "Drag & drop your payment screenshot"}
                </p>
                <p className="text-sm text-gray-400">or click to browse • JPEG, PNG, WebP • Max 5 MB</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center mt-6">
              <button
                type="button"
                onClick={() => navigate("/my-bookings")}
                className="text-gray-500 hover:text-gray-800 font-medium transition text-sm"
              >
                Upload Later →
              </button>
              <button
                type="submit"
                disabled={loading || !file}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Uploading...
                  </>
                ) : (
                  "Submit Screenshot"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PaymentPending;
