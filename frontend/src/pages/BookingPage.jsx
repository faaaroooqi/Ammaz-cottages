import { useState, useContext, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import API from "../utils/api";
import { showSuccess, showError } from "../utils/toast";
import { evaluateBookingDiscounts, getPublicDiscounts } from "../services/admin.service";

function BookingPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const { room, checkIn, checkOut } = location.state || {};

  const [formData, setFormData] = useState({
    customerName: user?.username || user?.name || "",
    customerEmail: user?.email || "",
    customerPhone: "",
    customerCnic: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Storewide discount state
  const [storewideInfo, setStorewideInfo] = useState({ durationDiscount: { percentage: 0 }, dateDiscount: { percentage: 0 } });
  const [allPublicDiscounts, setAllPublicDiscounts] = useState(null);

  // ID Card Upload Modal State
  const [showIdModal, setShowIdModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [idFiles, setIdFiles] = useState([]);
  const [uploadingId, setUploadingId] = useState(false);

  // Evaluate discounts on mount or when dates change
  useEffect(() => {
    if (!checkIn || !checkOut) return;

    // Fetch public rules for up-sell tips
    getPublicDiscounts()
      .then((res) => setAllPublicDiscounts(res.data))
      .catch(() => {});

    // Evaluate for exact selected dates
    const inD = new Date(checkIn);
    const outD = new Date(checkOut);
    inD.setHours(0, 0, 0, 0);
    outD.setHours(0, 0, 0, 0);
    const diffT = Math.abs(outD - inD);
    const diffD = Math.ceil(diffT / (1000 * 60 * 60 * 24));
    const calcNights = diffD > 0 ? diffD : 1;

    evaluateBookingDiscounts({ nights: calcNights, checkIn, checkOut })
      .then((res) => setStorewideInfo(res.data))
      .catch(() => {});
  }, [checkIn, checkOut]);

  if (!room || !checkIn || !checkOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Invalid Booking Request</h2>
          <button onClick={() => navigate("/")} className="text-blue-600 underline">
            Go back to Rooms
          </button>
        </div>
      </div>
    );
  }

  // Calculate nights
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  inDate.setHours(0, 0, 0, 0);
  outDate.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(outDate - inDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const nights = diffDays > 0 ? diffDays : 1;
  const baseAmount = nights * room.pricePerNight;

  // Individual discounts
  const loyaltyPct = user?.discountPercentage || 0;
  const durationPct = storewideInfo?.durationDiscount?.percentage || 0;
  const datePct = storewideInfo?.dateDiscount?.percentage || 0;

  const totalDiscountPct = Math.min(100, loyaltyPct + durationPct + datePct);
  const totalDiscountAmount = Math.round((baseAmount * totalDiscountPct) / 100);
  const totalAmount = Math.max(0, baseAmount - totalDiscountAmount);

  // Up-sell tip helper (e.g. if nights is 5, tip for 7 days)
  const getUpsellTip = () => {
    if (!allPublicDiscounts?.stayDiscounts) return null;
    const { sevenDays, fifteenDays, thirtyDays } = allPublicDiscounts.stayDiscounts;

    if (nights < 7 && sevenDays?.enabled && sevenDays.percentage > 0) {
      const needed = 7 - nights;
      return `💡 Book ${needed} more ${needed === 1 ? 'night' : 'nights'} to unlock a ${sevenDays.percentage}% Long-Stay Discount!`;
    }
    if (nights >= 7 && nights < 15 && fifteenDays?.enabled && fifteenDays.percentage > 0) {
      const needed = 15 - nights;
      return `💡 Book ${needed} more ${needed === 1 ? 'night' : 'nights'} to upgrade to a ${fifteenDays.percentage}% Long-Stay Discount!`;
    }
    if (nights >= 15 && nights < 30 && thirtyDays?.enabled && thirtyDays.percentage > 0) {
      const needed = 30 - nights;
      return `💡 Book ${needed} more ${needed === 1 ? 'night' : 'nights'} to upgrade to a ${thirtyDays.percentage}% Long-Stay Discount!`;
    }
    return null;
  };

  const upsellTip = getUpsellTip();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/bookings", {
        roomId: room._id,
        checkIn,
        checkOut,
        ...formData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newBooking = res.data.booking;
      setCreatedBooking(newBooking);
      showSuccess("Details saved successfully!");
      setShowIdModal(true);

    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to create booking";
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleIdUpload = async () => {
    if (idFiles.length === 0) {
      alert("Please select at least one ID card picture.");
      return;
    }

    setUploadingId(true);
    try {
      const data = new FormData();
      Array.from(idFiles).forEach(file => {
        data.append("idCards", file);
      });

      await API.post(`/bookings/${createdBooking._id}/upload-id-cards`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      showSuccess("ID Card uploaded successfully!");
      setShowIdModal(false);
      navigate(`/payment/pending?bookingId=${createdBooking._id}`);
    } catch (err) {
      console.error(err);
      showError("Failed to upload ID cards. Please try again.");
    } finally {
      setUploadingId(false);
    }
  };

  const handleSkipIdUpload = () => {
    setShowIdModal(false);
    navigate(`/payment/pending?bookingId=${createdBooking._id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-blue-600 transition mb-6"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          Back to Room Details
        </button>

        {/* Up-sell / Discount Notification Callout */}
        {upsellTip && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold p-4 rounded-2xl shadow-md mb-6 flex items-center justify-between animate-pulse">
            <span className="text-sm md:text-base">{upsellTip}</span>
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-1 bg-white text-orange-600 rounded-lg text-xs font-black hover:bg-orange-50 transition"
            >
              Adjust Dates
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row border border-gray-100 dark:border-gray-800">
          
          {/* Left Column: Room Summary */}
          <div className="lg:w-2/5 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 opacity-20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
            
            <div className="relative z-10 flex-1">
              <h2 className="text-2xl font-extrabold mb-8 tracking-tight text-white/90">Booking Summary</h2>
              
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-white mb-3 tracking-tight leading-tight">{room.name}</h3>
                <p className="text-blue-100/80 text-sm line-clamp-3 mb-8 leading-relaxed">{room.description}</p>
                
                <div className="space-y-4 bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-200 text-sm font-medium">Check-in</span>
                    <span className="font-bold">{new Date(checkIn).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-200 text-sm font-medium">Check-out</span>
                    <span className="font-bold">{new Date(checkOut).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="border-t border-white/20 pt-4 mt-2 flex justify-between items-center">
                    <span className="text-blue-200 text-sm font-medium">Duration</span>
                    <span className="font-bold">{nights} {nights === 1 ? 'night' : 'nights'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-200 text-sm font-medium">Rate</span>
                    <span className="font-bold">PKR {room.pricePerNight} / night</span>
                  </div>

                  {/* Active Discounts Breakdown */}
                  {loyaltyPct > 0 && (
                    <div className="flex justify-between items-center text-green-300 text-xs font-bold pt-2 border-t border-white/10">
                      <span>Loyalty Discount ({loyaltyPct}%)</span>
                      <span>- PKR {((baseAmount * loyaltyPct) / 100).toLocaleString()}</span>
                    </div>
                  )}
                  {durationPct > 0 && (
                    <div className="flex justify-between items-center text-yellow-300 text-xs font-bold">
                      <span>{storewideInfo.durationDiscount.label}</span>
                      <span>- PKR {((baseAmount * durationPct) / 100).toLocaleString()}</span>
                    </div>
                  )}
                  {datePct > 0 && (
                    <div className="flex justify-between items-center text-amber-300 text-xs font-bold">
                      <span>{storewideInfo.dateDiscount.label}</span>
                      <span>- PKR {((baseAmount * datePct) / 100).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="relative z-10 mt-auto pt-6 border-t border-white/20">
              <div className="flex justify-between items-end">
                <span className="text-lg text-blue-200 font-medium">Total Amount</span>
                <div className="text-right">
                  {totalDiscountPct > 0 && (
                    <div className="text-sm text-blue-200/70 line-through mb-1">PKR {baseAmount.toLocaleString()}</div>
                  )}
                  <span className="text-4xl font-extrabold tracking-tight">PKR {totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:w-3/5 p-8 lg:p-12 bg-white dark:bg-gray-900">
            <div className="mb-10">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Guest Details</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Please fill in your information to complete the booking.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-8 shadow-sm flex items-start">
                <span className="mr-3 text-lg">⚠️</span>
                <p className="text-sm font-semibold mt-0.5">{error}</p>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Full Name</label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all outline-none font-semibold shadow-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Email Address</label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                    className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all outline-none font-semibold shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Phone Number</label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    required
                    placeholder="+92 300 1234567"
                    className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all outline-none font-semibold shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">CNIC / Passport No.</label>
                  <input
                    type="text"
                    name="customerCnic"
                    value={formData.customerCnic}
                    onChange={handleChange}
                    required
                    placeholder="42101-1234567-1"
                    className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all outline-none font-semibold shadow-sm"
                  />
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-5 px-8 rounded-2xl shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 text-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Payment</span>
                      <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

      {/* ID Card Upload Modal */}
      {showIdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                🪪
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">Upload ID Card Photo</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Please attach a photo of your CNIC or Passport for guest verification. You can also skip this and upload it later.
              </p>
            </div>

            <div className="mb-6">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setIdFiles(e.target.files)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition"
              />
              {idFiles.length > 0 && (
                <p className="text-xs text-green-600 font-semibold mt-2">
                  {idFiles.length} file(s) selected
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSkipIdUpload}
                disabled={uploadingId}
                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition text-sm"
              >
                Skip for now
              </button>
              <button
                onClick={handleIdUpload}
                disabled={uploadingId}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition text-sm shadow-md disabled:opacity-50"
              >
                {uploadingId ? "Uploading..." : "Upload & Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingPage;
