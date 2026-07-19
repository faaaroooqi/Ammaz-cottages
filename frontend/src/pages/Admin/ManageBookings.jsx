import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { getBookings, markCashPayment, updateBooking, deleteBooking, createBooking } from "../../services/admin.service";
import BookingModal from "../../components/Admin/BookingModal";
import { showSuccess, showError, showConfirm } from "../../utils/toast";

function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [screenshotUrl, setScreenshotUrl] = useState(null);
  const [idCardImages, setIdCardImages] = useState(null);
  const [activeIdCardIndex, setActiveIdCardIndex] = useState(0);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    loadBookings();
    // Auto-refresh bookings list every 15 seconds
    const interval = setInterval(loadBookings, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadBookings = async () => {
    try {
      const res = await getBookings();
      setBookings(res.data.bookings);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCashApprove = async (bookingId, isHalfPaid = false) => {
    setOpenMenuId(null);
    const message = isHalfPaid
      ? "Mark this booking as half paid (50% amount)?"
      : "Mark this booking as fully paid?";
    const ok = await showConfirm(message);
    if (ok) {
      try {
        await markCashPayment({
          bookingId,
          remarks: isHalfPaid ? "Half payment paid at reception" : "Payment paid at reception",
          isHalfPaid
        });
        showSuccess(isHalfPaid ? "Booking marked as half paid!" : "Booking marked as fully paid!");
        loadBookings();
      } catch (err) {
        showError("Error approving payment");
      }
    }
  };

  const handleEdit = (booking) => {
    setOpenMenuId(null);
    setEditingBooking(booking);
    setIsModalOpen(true);
  };

  const handleDelete = async (bookingId) => {
    setOpenMenuId(null);
    const ok = await showConfirm("Are you sure you want to permanently delete this booking?");
    if (ok) {
      try {
        await deleteBooking(bookingId);
        showSuccess("Booking deleted successfully!");
        loadBookings();
      } catch (err) {
        console.error("Error deleting booking", err);
        showError("Failed to delete booking");
      }
    }
  };

  const handleSaveBooking = async (bookingData) => {
    try {
      if (editingBooking) {
        await updateBooking(editingBooking._id, bookingData);
      } else {
        await createBooking(bookingData);
      }
      setIsModalOpen(false);
      showSuccess(editingBooking ? "Booking updated!" : "Booking created!");
      loadBookings();
    } catch (err) {
      console.error("Error saving booking", err);
      showError(err.response?.data?.message || "Failed to save booking");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "awaiting_payment":
        return <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold uppercase">Awaiting Payment</span>;
      case "confirmed_half_paid":
        return <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-xs font-bold uppercase">Confirmed (Half Paid)</span>;
      case "confirmed":
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold uppercase">Confirmed</span>;
      case "cancelled":
        return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold uppercase">Cancelled</span>;
      case "completed":
        return <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold uppercase">Completed</span>;
      case "requested":
        return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold uppercase">Requested</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Link to="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition mb-4 font-semibold">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
      </Link>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Manage Bookings</h2>
        <button
          onClick={() => {
            setEditingBooking(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold shadow transition flex items-center gap-2"
        >
          <span>➕</span> Add New Booking
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm uppercase tracking-wider text-gray-500">
              <th className="p-4 font-semibold">Booking ID</th>
              <th className="p-4 font-semibold">Room</th>
              <th className="p-4 font-semibold">Customer</th>
              <th className="p-4 font-semibold">Dates</th>
              <th className="p-4 font-semibold">Amount</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500">
                  No bookings found.
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-blue-600">{b.bookingId}</td>
                  <td className="p-4 font-medium text-gray-900">{b.room?.name || "Deleted Room"}</td>
                  <td className="p-4">
                    <p className="font-semibold text-gray-800">{b.customer?.name}</p>
                    <p className="text-xs text-gray-500">{b.customer?.phone}</p>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-bold text-gray-800">PKR {b.totalAmount?.toLocaleString()}</td>
                  <td className="p-4">{getStatusBadge(b.status)}</td>

                  {/* ── Three-Dot Action Menu ── */}
                  <td className="p-4 text-center">
                    <div className="relative inline-block" ref={openMenuId === b._id ? menuRef : null}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === b._id ? null : b._id)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                        title="Actions"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="19" r="1.5" />
                        </svg>
                      </button>

                      {openMenuId === b._id && (
                        <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl z-20 border border-gray-200 overflow-hidden animate-in">
                          <div className="py-1">
                            {/* Edit */}
                            <button
                              onClick={() => handleEdit(b)}
                              className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
                            >
                              <span className="text-base">✏️</span> Edit Booking
                            </button>

                            {/* View Screenshot */}
                            {b.paymentScreenshot && (
                              <button
                                onClick={() => { setOpenMenuId(null); setScreenshotUrl(b.paymentScreenshot); }}
                                className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
                              >
                                <span className="text-base">👁️</span> View Screenshot
                              </button>
                            )}

                            {/* View ID Cards */}
                            {b.idCardImages && b.idCardImages.length > 0 && (
                              <button
                                onClick={() => { setOpenMenuId(null); setIdCardImages(b.idCardImages); setActiveIdCardIndex(0); }}
                                className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors font-medium"
                              >
                                <span className="text-base">🪪</span> View ID Cards ({b.idCardImages.length})
                              </button>
                            )}

                            {/* Mark as Paid / Fully Paid */}
                            {(b.status === "awaiting_payment" || b.status === "requested" || b.status === "confirmed_half_paid") && (
                              <button
                                onClick={() => handleCashApprove(b._id, false)}
                                className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 transition-colors font-medium"
                              >
                                <span className="text-base">✅</span> {b.status === "confirmed_half_paid" ? "Mark as Fully Paid" : "Mark as Paid"}
                              </button>
                            )}

                            {/* Mark as Half Paid */}
                            {(b.status === "awaiting_payment" || b.status === "requested") && (
                              <button
                                onClick={() => handleCashApprove(b._id, true)}
                                className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition-colors font-medium"
                              >
                                <span className="text-base">🌓</span> Mark as Half Paid
                              </button>
                            )}

                            {/* Divider */}
                            <div className="border-t border-gray-100 my-1" />

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(b._id)}
                              className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-bold"
                            >
                              <span className="text-base">🗑️</span> Delete Booking
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBooking}
        bookingData={editingBooking}
      />

      {/* ── Screenshot Lightbox ─────────────────────────────────────── */}
      {screenshotUrl && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          onClick={() => setScreenshotUrl(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">Payment Screenshot</h3>
              <button
                onClick={() => setScreenshotUrl(null)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none transition"
              >
                ✕
              </button>
            </div>
            <div className="p-4 flex justify-center bg-gray-100 max-h-[70vh] overflow-auto">
              <img
                src={screenshotUrl}
                alt="Payment Screenshot"
                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow"
              />
            </div>
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <a
                href={screenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition"
              >
                Open Full Size ↗
              </a>
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

      {/* ── ID Cards Lightbox ─────────────────────────────────────── */}
      {idCardImages && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          onClick={() => setIdCardImages(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">
                🪪 ID Card {activeIdCardIndex + 1} of {idCardImages.length}
              </h3>
              <button
                onClick={() => setIdCardImages(null)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none transition"
              >
                ✕
              </button>
            </div>
            <div className="p-4 flex justify-center bg-gray-100 max-h-[70vh] overflow-auto relative">
              <img
                src={idCardImages[activeIdCardIndex]}
                alt={`ID Card ${activeIdCardIndex + 1}`}
                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow"
              />
            </div>
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <div className="flex gap-2">
                {idCardImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveIdCardIndex(i => Math.max(0, i - 1))}
                      disabled={activeIdCardIndex === 0}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300 transition disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={() => setActiveIdCardIndex(i => Math.min(idCardImages.length - 1, i + 1))}
                      disabled={activeIdCardIndex === idCardImages.length - 1}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300 transition disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </>
                )}
              </div>
              <div className="flex gap-3">
                <a
                  href={idCardImages[activeIdCardIndex]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition"
                >
                  Open Full Size ↗
                </a>
                <button
                  onClick={() => setIdCardImages(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageBookings;