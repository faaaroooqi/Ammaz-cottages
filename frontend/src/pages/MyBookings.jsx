import { useContext, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import API from "../utils/api";
import { showSuccess, showError } from "../utils/toast";

function MyBookings() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [screenshotUrl, setScreenshotUrl] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchMyBookings = async () => {
      try {
        setLoading(true);
        const res = await API.get("/bookings/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBookings(res.data.bookings || []);
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyBookings();
  }, [token]);

  const getStatusConfig = (status) => {
    switch (status) {
      case "confirmed":
        return { bg: "bg-emerald-50 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", label: "Confirmed", icon: "✅", step: 3 };
      case "confirmed_half_paid":
        return { bg: "bg-teal-50 dark:bg-teal-950/60", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800", label: "Confirmed (Half Paid)", icon: "🌓", step: 3 };
      case "awaiting_payment":
        return { bg: "bg-amber-50 dark:bg-amber-950/60", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800", label: "Awaiting Receipt Verification", icon: "⏳", step: 2 };
      case "completed":
        return { bg: "bg-blue-50 dark:bg-blue-950/60", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800", label: "Stay Completed", icon: "🏁", step: 4 };
      case "cancelled":
        return { bg: "bg-rose-50 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800", label: "Cancelled", icon: "❌", step: 0 };
      default:
        return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", border: "border-slate-200 dark:border-slate-700", label: status?.replace("_", " ") || "Pending", icon: "📋", step: 1 };
    }
  };

  const filteredBookings = useMemo(() => {
    const now = new Date();
    return bookings.filter((b) => {
      const checkIn = new Date(b.checkIn);
      if (activeTab === "upcoming") return checkIn >= now && b.status !== "cancelled";
      if (activeTab === "completed") return b.status === "completed" || checkIn < now;
      if (activeTab === "cancelled") return b.status === "cancelled";
      return true;
    });
  }, [bookings, activeTab]);

  const handleDeleteConfirm = async () => {
    if (!bookingToDelete) return;
    setIsDeleting(true);
    const isFuture = new Date() < new Date(bookingToDelete.checkIn) && bookingToDelete.status !== "cancelled";
    try {
      await API.delete(`/bookings/${bookingToDelete._id}/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (isFuture) {
        setBookings(bookings.map(b => b._id === bookingToDelete._id ? { ...b, status: "cancelled" } : b));
        showSuccess("Reservation cancelled successfully");
      } else {
        setBookings(bookings.filter(b => b._id !== bookingToDelete._id));
        showSuccess("Reservation removed from dashboard");
      }
      setBookingToDelete(null);
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || `Failed to ${isFuture ? "cancel" : "delete"} booking`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white pt-16 pb-28 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto z-10 relative">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full mb-4">
            <span className="text-indigo-200 text-xs font-black uppercase tracking-wider">
              My Trips & Reservations
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">My Bookings Dashboard</h1>
          <p className="text-sm text-indigo-200/80 font-medium">Manage check-in dates, digital vouchers, and payment receipts.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        
        {/* Booking.com Style Tab Bar */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-2 shadow-lg mb-8 flex overflow-x-auto no-scrollbar gap-2">
          {[
            { id: "all", label: "All Reservations", icon: "📑" },
            { id: "upcoming", label: "Upcoming Stays", icon: "🧳" },
            { id: "completed", label: "Completed", icon: "🏁" },
            { id: "cancelled", label: "Cancelled", icon: "🚫" },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[130px] px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                  active
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content List */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading your stays…</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-16 text-center">
            <div className="text-6xl mb-4">🧳</div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No bookings found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-6">You don't have any reservations under this category.</p>
            <button
              onClick={() => navigate("/")}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 transition shadow-md"
            >
              Explore Available Rooms
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => {
              const status = getStatusConfig(booking.status);
              return (
                <div
                  key={booking._id}
                  className={`bg-white dark:bg-slate-900 rounded-3xl shadow-sm border ${status.border} overflow-hidden transition-all hover:shadow-xl`}
                >
                  <div className="flex flex-col md:flex-row">
                    
                    {/* Room Thumbnail */}
                    <div className="md:w-56 h-48 md:h-auto bg-slate-100 dark:bg-slate-800 relative shrink-0 overflow-hidden">
                      {booking.room?.images?.[0] ? (
                        <img
                          src={booking.room.images[0]}
                          alt={booking.room.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">🏨</div>
                      )}
                      
                      <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-mono font-bold">
                        #{booking.bookingId?.slice(-8) || booking._id.slice(-6)}
                      </div>
                    </div>

                    {/* Booking Information Details */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">{booking.room?.name || "Resort Room"}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{booking.room?.type || "Standard Suite"}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`${status.bg} ${status.text} px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 border border-current/20`}>
                              {status.icon} {status.label}
                            </span>
                            
                            {/* Actions Dropdown */}
                            <div className="relative">
                              <button
                                onClick={() => setOpenDropdownId(openDropdownId === booking._id ? null : booking._id)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                              </button>
                              {openDropdownId === booking._id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl z-20 border border-slate-200 dark:border-slate-700 overflow-hidden">
                                  <button
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      setBookingToDelete(booking);
                                    }}
                                    className="block w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold transition"
                                  >
                                    {new Date() < new Date(booking.checkIn) && booking.status !== "cancelled"
                                      ? "Cancel Reservation"
                                      : "Remove from Dashboard"}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Dates & Price Summary */}
                        <div className="grid grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-4 border border-slate-200/60 dark:border-slate-700/60">
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Check-in</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {new Date(booking.checkIn).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Check-out</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {new Date(booking.checkOut).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Amount</span>
                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                              PKR {Number(booking.totalAmount).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Bar Buttons */}
                      <div className="flex items-center gap-3 flex-wrap pt-2">
                        {booking.paymentScreenshot && (
                          <button
                            onClick={() => setScreenshotUrl(booking.paymentScreenshot)}
                            className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-emerald-100 transition"
                          >
                            <img src={booking.paymentScreenshot} alt="Receipt" className="w-5 h-5 rounded object-cover" />
                            View Payment Receipt
                          </button>
                        )}

                        {["confirmed", "confirmed_half_paid", "cash_paid", "completed"].includes(booking.status) && (
                          <button
                            onClick={() => navigate(`/voucher/${booking._id}`)}
                            className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-100 transition"
                          >
                            📄 Digital Pass & Voucher
                          </button>
                        )}

                        {(booking.status === "awaiting_payment" || booking.status === "requested") && !booking.paymentScreenshot && (
                          <button
                            onClick={() => navigate("/payment/pending", { state: { booking } })}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 transition shadow-sm flex items-center gap-1.5"
                          >
                            📤 Upload Receipt Photo
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Screenshot Lightbox */}
      {screenshotUrl && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-overlay-in"
          onClick={() => setScreenshotUrl(null)}
        >
          <div
            className="relative max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Payment Receipt Image</h3>
              <button onClick={() => setScreenshotUrl(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>
            <div className="p-4 flex justify-center bg-slate-100 dark:bg-slate-950 max-h-[70vh] overflow-auto">
              <img src={screenshotUrl} alt="Payment Receipt" className="max-w-full max-h-[65vh] object-contain rounded-2xl shadow" />
            </div>
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button onClick={() => setScreenshotUrl(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel/Delete Confirmation Modal */}
      {bookingToDelete && (() => {
        const isFuture = new Date() < new Date(bookingToDelete.checkIn) && bookingToDelete.status !== "cancelled";
        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-overlay-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-modal-in border border-slate-200 dark:border-slate-800">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                ⚠️
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                {isFuture ? "Cancel Reservation?" : "Remove Reservation?"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed">
                {isFuture 
                  ? "Standard policy: 50% refund applies to cancelled bookings once processed by management." 
                  : "This will remove the reservation card from your active dashboard view."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setBookingToDelete(null)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs rounded-2xl transition"
                  disabled={isDeleting}
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-2xl transition disabled:opacity-50"
                >
                  {isDeleting ? "Processing..." : (isFuture ? "Cancel Booking" : "Remove")}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}

export default MyBookings;

