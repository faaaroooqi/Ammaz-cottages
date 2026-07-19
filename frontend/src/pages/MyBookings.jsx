import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import API from "../utils/api";
import { showSuccess, showError } from "../utils/toast";

function MyBookings() {
  const { token, theme } = useContext(AuthContext);
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [screenshotUrl, setScreenshotUrl] = useState(null); // lightbox
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ✅ Fetch customer bookings
  useEffect(() => {
    const fetchMyBookings = async () => {
      try {
        const res = await API.get("/bookings/my", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
        return { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", label: "Confirmed", icon: "✅" };
      case "confirmed_half_paid":
        return { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200", label: "Confirmed (Half Paid)", icon: "🌓" };
      case "awaiting_payment":
        return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Awaiting Payment", icon: "⏳" };
      case "completed":
        return { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", label: "Completed", icon: "🏁" };
      case "cancelled":
        return { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", label: "Cancelled", icon: "❌" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200", label: status?.replace("_", " ") || "Unknown", icon: "📋" };
    }
  };

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
        showSuccess("Booking cancelled successfully");
      } else {
        setBookings(bookings.filter(b => b._id !== bookingToDelete._id));
        showSuccess("Booking removed from history");
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-blue-900 pt-28 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-extrabold text-white tracking-tight">My Bookings</h2>
          <p className="text-blue-200 mt-2 font-medium">Track and manage all your reservations</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8 pb-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-16 text-center">
            <div className="text-6xl mb-4">🧳</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No bookings yet</h3>
            <p className="text-gray-500 mb-6">Start by browsing our rooms and making your first reservation!</p>
            <button
              onClick={() => navigate("/")}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-md"
            >
              Browse Rooms
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const status = getStatusConfig(booking.status);
              return (
                <div
                  key={booking._id}
                  className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border ${status.border} overflow-hidden transition-all hover:shadow-md`}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Room Image */}
                    <div className="md:w-48 h-40 md:h-auto bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
                      {booking.room?.images?.[0] ? (
                        <img
                          src={booking.room.images[0]}
                          alt={booking.room.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">🏨</div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{booking.room?.name || "Room"}</h3>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">{booking.bookingId}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`${status.bg} ${status.text} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
                            {status.icon} {status.label}
                          </span>
                          
                          {/* Three Dot Menu */}
                          <div className="relative">
                            <button
                              onClick={() => setOpenDropdownId(openDropdownId === booking._id ? null : booking._id)}
                              className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                            </button>
                            {openDropdownId === booking._id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-10 border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      setBookingToDelete(booking);
                                    }}
                                    className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold transition-colors"
                                  >
                                    {new Date() < new Date(booking.checkIn) && booking.status !== "cancelled"
                                      ? "Cancel Booking"
                                      : "Delete Booking"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-500 mb-4 line-clamp-1">{booking.room?.description}</p>

                      {/* Dates & Price */}
                      <div className="flex flex-wrap gap-6 text-sm mb-4">
                        <div>
                          <span className="text-gray-400 text-xs font-semibold uppercase">Check-in</span>
                          <p className="font-bold text-gray-800">{new Date(booking.checkIn).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs font-semibold uppercase">Check-out</span>
                          <p className="font-bold text-gray-800">{new Date(booking.checkOut).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs font-semibold uppercase">Total</span>
                          <p className="font-extrabold text-gray-900 text-lg">PKR {booking.totalAmount}</p>
                        </div>
                      </div>

                      {/* Screenshot & Actions */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Show screenshot thumbnail if uploaded */}
                        {booking.paymentScreenshot && (
                          <button
                            onClick={() => setScreenshotUrl(booking.paymentScreenshot)}
                            className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-100 transition"
                          >
                            <img
                              src={booking.paymentScreenshot}
                              alt="Receipt"
                              className="w-6 h-6 rounded object-cover"
                            />
                            View Receipt
                          </button>
                        )}

                        {/* View Voucher for paid bookings */}
                        {["confirmed", "confirmed_half_paid", "cash_paid", "completed"].includes(booking.status) && (
                          <button
                            onClick={() => navigate(`/voucher/${booking._id}`)}
                            className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition"
                          >
                            📄 View Voucher
                          </button>
                        )}

                        {/* Upload screenshot for pending bookings */}
                        {(booking.status === "awaiting_payment" || booking.status === "requested") && !booking.paymentScreenshot && (
                          <button
                            onClick={() => navigate("/payment/pending", { state: { booking } })}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-sm flex items-center gap-1.5"
                          >
                            📤 Upload Payment Receipt
                          </button>
                        )}

                        {/* Re-upload option if screenshot exists but still awaiting */}
                        {booking.status === "awaiting_payment" && booking.paymentScreenshot && (
                          <button
                            onClick={() => navigate("/payment/pending", { state: { booking } })}
                            className="text-blue-600 text-xs font-bold hover:text-blue-800 underline transition"
                          >
                            Re-upload
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

      {/* ── Screenshot Lightbox ─────────────────────────────────────── */}
      {screenshotUrl && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          onClick={() => setScreenshotUrl(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800">Payment Receipt</h3>
              <button
                onClick={() => setScreenshotUrl(null)}
                className="text-gray-400 hover:text-gray-700 text-xl transition"
              >
                ✕
              </button>
            </div>
            <div className="p-4 flex justify-center bg-gray-100 max-h-[70vh] overflow-auto">
              <img
                src={screenshotUrl}
                alt="Payment Receipt"
                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow"
              />
            </div>
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setScreenshotUrl(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete/Cancel Confirmation Modal ─────────────────────────────────────── */}
      {bookingToDelete && (() => {
        const isFuture = new Date() < new Date(bookingToDelete.checkIn) && bookingToDelete.status !== "cancelled";
        return (
          <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-overlay-in">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-modal-in border border-gray-100 dark:border-gray-800">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                ⚠️
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isFuture ? "Cancel Booking?" : "Delete Booking?"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">
                {isFuture 
                  ? "A 50% refund policy applies to cancellations. The booking will be marked as cancelled in the system." 
                  : "This will only remove the booking from your history/dashboard. It will remain preserved on the admin portal."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setBookingToDelete(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 font-bold rounded-xl transition"
                  disabled={isDeleting}
                >
                  No, Keep it
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center"
                >
                  {isDeleting 
                    ? (isFuture ? "Cancelling..." : "Deleting...") 
                    : (isFuture ? "Yes, Cancel Booking" : "Yes, Delete")}
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
