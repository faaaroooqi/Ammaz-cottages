import { useState, useContext } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import API from "../utils/api";
import { showSuccess, showError } from "../utils/toast";

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

  // ID Card Upload Modal State
  const [showIdModal, setShowIdModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [idFiles, setIdFiles] = useState([]);
  const [uploadingId, setUploadingId] = useState(false);

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

  // Calculate nights exactly like the backend to show correct total
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  inDate.setHours(0, 0, 0, 0);
  outDate.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(outDate - inDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const nights = diffDays > 0 ? diffDays : 1;
  const baseAmount = nights * room.pricePerNight;
  const discountPercentage = user?.discountPercentage || 0;
  const discountAmount = discountPercentage > 0 ? (baseAmount * discountPercentage) / 100 : 0;
  const totalAmount = baseAmount - discountAmount;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Create booking
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
      setShowIdModal(true); // Open ID modal instead of navigating to payment immediately

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
        data.append("images", file);
      });

      await API.post(`/bookings/${createdBooking._id}/idcards`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });

      // Redirect to payment pending
      showSuccess("ID uploaded successfully!");
      navigate("/payment/pending", { state: { booking: createdBooking } });
    } catch (err) {
      console.error("Failed to upload ID cards", err);
      showError("Failed to upload ID cards. Please try again.");
    } finally {
      setUploadingId(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 font-sans flex flex-col justify-center relative">
      <div className="max-w-5xl mx-auto w-full">
        <div className="mb-6">
          <button 
            onClick={() => navigate("/")} 
            className="flex items-center text-gray-500 hover:text-blue-600 font-medium transition-colors w-fit"
          >
            <span className="mr-2">←</span> Back to Rooms
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-gray-100 dark:border-gray-800">
          
          {/* Left Column: Summary Card */}
          <div className="lg:w-2/5 bg-gradient-to-br from-indigo-900 to-blue-900 text-white p-8 flex flex-col relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
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
                  {discountPercentage > 0 && (
                    <div className="flex justify-between items-center mt-2 text-green-300">
                      <span className="text-sm font-bold flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path></svg>
                        Loyalty Discount ({discountPercentage}%)
                      </span>
                      <span className="font-bold">- PKR {discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="relative z-10 mt-auto pt-6 border-t border-white/20">
              <div className="flex justify-between items-end">
                <span className="text-lg text-blue-200 font-medium">Total Amount</span>
                <div className="text-right">
                  {discountPercentage > 0 && (
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
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">CNIC <span className="text-gray-400 dark:text-gray-500 font-normal">(Required)</span></label>
                  <input
                    type="text"
                    name="customerCnic"
                    value={formData.customerCnic}
                    onChange={handleChange}
                    placeholder="12345-6789012-3"
                    className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all outline-none font-semibold shadow-sm"
                  />
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex justify-center items-center"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Confirm & Proceed to ID Upload"
                  )}
                </button>
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 font-medium mt-4">
                  For security purposes, you will be required to upload your ID card pictures next.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ID Upload Modal */}
      {showIdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-overlay-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-8 relative animate-modal-in border border-gray-100 dark:border-gray-800">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                🪪
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Security Check</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">
                Please upload clear pictures of your ID card (Front & Back) to secure your booking.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer relative overflow-hidden">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={(e) => setIdFiles(e.target.files)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center pointer-events-none">
                  <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Click to select images</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                </div>
              </div>

              {idFiles.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Selected Files</h4>
                  <ul className="space-y-2">
                    {Array.from(idFiles).map((f, i) => (
                      <li key={i} className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {f.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleIdUpload}
                disabled={uploadingId || idFiles.length === 0}
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex justify-center items-center"
              >
                {uploadingId ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading & Saving...
                  </span>
                ) : (
                  "Upload & Continue to Payment"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default BookingPage;
