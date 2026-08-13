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

    getPublicDiscounts()
      .then((res) => setAllPublicDiscounts(res.data))
      .catch(() => {});

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Invalid Booking Session</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-6">
            Please select arrival and departure dates from the room details page to initiate booking.
          </p>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md transition"
          >
            Explore Rooms
          </button>
        </div>
      </div>
    );
  }

  // Calculate nights & base amount
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  inDate.setHours(0, 0, 0, 0);
  outDate.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(outDate - inDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const nights = diffDays > 0 ? diffDays : 1;
  const baseAmount = nights * room.pricePerNight;

  // Discounts
  const loyaltyPct = user?.discountPercentage || 0;
  const durationPct = storewideInfo?.durationDiscount?.percentage || 0;
  const datePct = storewideInfo?.dateDiscount?.percentage || 0;

  const totalDiscountPct = Math.min(100, loyaltyPct + durationPct + datePct);
  const totalDiscountAmount = Math.round((baseAmount * totalDiscountPct) / 100);
  const totalAmount = Math.max(0, baseAmount - totalDiscountAmount);

  // Up-sell tip helper
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
      showSuccess("Reservation request initialized!");
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

      showSuccess("Guest verification ID uploaded!");
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-xs font-black text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-full shadow-sm transition-all transform hover:-translate-x-0.5"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            Back to Room Selection
          </button>
          
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
            Step 2 of 3 • Confirm & Guest Info
          </span>
        </div>

        {/* Up-sell Banner Callout */}
        {upsellTip && (
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-bold p-4 rounded-3xl shadow-lg mb-8 flex items-center justify-between animate-pulse">
            <span className="text-xs sm:text-sm font-black">{upsellTip}</span>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-1.5 bg-white text-orange-600 rounded-full text-xs font-black hover:bg-orange-50 transition shadow shrink-0 ml-3"
            >
              Adjust Dates
            </button>
          </div>
        )}

        {/* 2-Column Airbnb Checkout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form & Trip Details (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Guest Info Box */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Primary Guest Details</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Information required for hotel registration and key access</p>
                </div>
                <span className="text-2xl">👤</span>
              </div>

              {error && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 p-4 rounded-2xl mb-6 text-xs font-bold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      required
                      placeholder="e.g. John Doe"
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-3.5 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-semibold transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleChange}
                      required
                      placeholder="e.g. john@example.com"
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-3.5 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-semibold transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleChange}
                      required
                      placeholder="+92 300 1234567"
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-3.5 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-semibold transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                      CNIC / Passport Number
                    </label>
                    <input
                      type="text"
                      name="customerCnic"
                      value={formData.customerCnic}
                      onChange={handleChange}
                      required
                      placeholder="42101-1234567-1"
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-3.5 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-semibold transition"
                    />
                  </div>
                </div>

                {/* House rules accordion callout */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-2 mt-4">
                  <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>📌</span>
                    <span>Resort Rules & Policy</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-500 dark:text-slate-400 font-medium">
                    <li>Check-in time starts at 02:00 PM; Check-out is by 12:00 PM.</li>
                    <li>Cancellations receive a 50% refund as per standard guest house policy.</li>
                    <li>Original CNIC / Passport is required at check-in counter.</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm flex items-center justify-center space-x-2 disabled:opacity-50 mt-6"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      <span>Processing Reservation...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Proceed to Payment</span>
                      <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>

              </form>
            </div>

          </div>

          {/* Right Column: Sticky Airbnb Style Price Summary Card (5 cols) */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
              
              {/* Room Card Preview Header */}
              <div className="p-6 bg-gradient-to-br from-slate-950 to-indigo-950 text-white flex items-center gap-4 relative overflow-hidden">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-slate-800 border border-white/20">
                  {room.images?.[0] ? (
                    <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🏨</div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block mb-0.5">
                    Selected Accommodation
                  </span>
                  <h3 className="text-lg font-black text-white leading-tight">{room.name}</h3>
                  <p className="text-xs text-indigo-200/80 mt-1 font-medium">Up to {room.capacity || 2} Guests</p>
                </div>
              </div>

              {/* Booking Dates Breakdown */}
              <div className="p-6 space-y-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Dates</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {new Date(checkIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {new Date(checkOut).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <span className="text-xs font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full">
                    {nights} {nights === 1 ? 'Night' : 'Nights'}
                  </span>
                </div>

                {/* Itemized Price Calculation */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>PKR {Number(room.pricePerNight).toLocaleString()} x {nights} nights</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">PKR {baseAmount.toLocaleString()}</span>
                  </div>

                  {loyaltyPct > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>Loyalty Discount ({loyaltyPct}%)</span>
                      <span>- PKR {((baseAmount * loyaltyPct) / 100).toLocaleString()}</span>
                    </div>
                  )}

                  {durationPct > 0 && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold">
                      <span>{storewideInfo.durationDiscount?.label || "Long-Stay Offer"}</span>
                      <span>- PKR {((baseAmount * durationPct) / 100).toLocaleString()}</span>
                    </div>
                  )}

                  {datePct > 0 && (
                    <div className="flex justify-between text-indigo-600 dark:text-indigo-400 font-bold">
                      <span>{storewideInfo.dateDiscount?.label || "Date Special"}</span>
                      <span>- PKR {((baseAmount * datePct) / 100).toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-400 text-[11px] pt-1">
                    <span>Taxes & Resort Fees</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Included</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-end">
                  <div>
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Due</span>
                    {totalDiscountPct > 0 && (
                      <span className="text-xs text-slate-400 line-through">PKR {baseAmount.toLocaleString()}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                      PKR {totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

              </div>

              {/* Trust Badges Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-around">
                <span className="flex items-center gap-1">🔒 SSL Encrypted</span>
                <span>•</span>
                <span className="flex items-center gap-1">⚡ Instant Voucher</span>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* ID Upload Verification Modal */}
      {showIdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-overlay-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 text-center animate-modal-in">
            
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
              🪪
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Upload Guest ID Photo</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium leading-relaxed">
              Please attach a photo of your CNIC or Passport for guest verification. You can also skip and present it at check-in counter.
            </p>

            <div className="mb-6">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setIdFiles(e.target.files)}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition"
              />
              {idFiles.length > 0 && (
                <p className="text-xs text-emerald-600 font-bold mt-2">
                  ✓ {idFiles.length} photo(s) selected
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSkipIdUpload}
                disabled={uploadingId}
                className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs rounded-2xl transition"
              >
                Skip for now
              </button>
              <button
                onClick={handleIdUpload}
                disabled={uploadingId}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs rounded-2xl transition shadow-md disabled:opacity-50"
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

