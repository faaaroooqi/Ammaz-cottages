import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { getBookings, markCashPayment, updateBooking, deleteBooking, createBooking } from "../../services/admin.service";
import BookingModal from "../../components/Admin/BookingModal";
import { showSuccess, showError, showConfirm } from "../../utils/toast";

/* ─── Floating Three-Dot Action Menu Component ─────────────────────── */
function BookingActionMenu({
  booking,
  onEdit,
  onViewScreenshot,
  onViewIdCards,
  onCashApprove,
  onDelete
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0, bottom: 0, openUp: false });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const calculatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 260 && rect.top > 260;

    setCoords({
      top: rect.bottom + 6,
      bottom: window.innerHeight - rect.top + 6,
      right: window.innerWidth - rect.right,
      openUp
    });
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!isOpen) {
      calculatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors focus:outline-none"
        title="Actions"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: coords.openUp ? "auto" : `${coords.top}px`,
            bottom: coords.openUp ? `${coords.bottom}px` : "auto",
            right: `${coords.right}px`,
            zIndex: 9999
          }}
          className="w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden text-left animate-in"
        >
          <div className="py-1">
            {/* Edit */}
            <button
              onClick={() => { setIsOpen(false); onEdit(booking); }}
              className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 transition-colors font-medium"
            >
              <span className="text-base">✏️</span> Edit Booking
            </button>

            {/* View Screenshot */}
            {booking.paymentScreenshot && (
              <button
                onClick={() => { setIsOpen(false); onViewScreenshot(booking.paymentScreenshot); }}
                className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 transition-colors font-medium"
              >
                <span className="text-base">👁️</span> View Screenshot
              </button>
            )}

            {/* View ID Cards */}
            {booking.idCardImages && booking.idCardImages.length > 0 && (
              <button
                onClick={() => { setIsOpen(false); onViewIdCards(booking.idCardImages); }}
                className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-400 transition-colors font-medium"
              >
                <span className="text-base">🪪</span> View ID Cards ({booking.idCardImages.length})
              </button>
            )}

            {/* Mark as Paid / Fully Paid */}
            {(booking.status === "awaiting_payment" || booking.status === "requested" || booking.status === "confirmed_half_paid") && (
              <button
                onClick={() => { setIsOpen(false); onCashApprove(booking._id, false); }}
                className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors font-medium"
              >
                <span className="text-base">✅</span> {booking.status === "confirmed_half_paid" ? "Mark as Fully Paid" : "Mark as Paid"}
              </button>
            )}

            {/* Mark as Half Paid */}
            {(booking.status === "awaiting_payment" || booking.status === "requested") && (
              <button
                onClick={() => { setIsOpen(false); onCashApprove(booking._id, true); }}
                className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors font-medium"
              >
                <span className="text-base">🌓</span> Mark as Half Paid
              </button>
            )}

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

            {/* Delete */}
            <button
              onClick={() => { setIsOpen(false); onDelete(booking._id); }}
              className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors font-bold"
            >
              <span className="text-base">🗑️</span> Delete Booking
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Main ManageBookings Component ───────────────────────────────── */
function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [screenshotUrl, setScreenshotUrl] = useState(null);
  const [idCardImages, setIdCardImages] = useState(null);
  const [activeIdCardIndex, setActiveIdCardIndex] = useState(0);

  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 15000);
    return () => clearInterval(interval);
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
    setEditingBooking(booking);
    setIsModalOpen(true);
  };

  const handleDelete = async (bookingId) => {
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
        return <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 px-3 py-1 rounded-full text-xs font-bold uppercase">Awaiting Payment</span>;
      case "confirmed_half_paid":
        return <span className="bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 px-3 py-1 rounded-full text-xs font-bold uppercase">Confirmed (Half Paid)</span>;
      case "confirmed":
        return <span className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 px-3 py-1 rounded-full text-xs font-bold uppercase">Confirmed</span>;
      case "cancelled":
        return <span className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 px-3 py-1 rounded-full text-xs font-bold uppercase">Cancelled</span>;
      case "completed":
        return <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-bold uppercase">Completed</span>;
      case "requested":
        return <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 px-3 py-1 rounded-full text-xs font-bold uppercase">Requested</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Link to="/admin" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 transition mb-4 font-semibold">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
      </Link>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Manage Bookings</h2>
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

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="p-4 font-semibold">Booking ID</th>
                <th className="p-4 font-semibold">Room</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Dates</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 font-bold text-blue-600 dark:text-blue-400">{b.bookingId}</td>
                    <td className="p-4 font-medium text-gray-900 dark:text-white">{b.room?.name || "Deleted Room"}</td>
                    <td className="p-4">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{b.customer?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{b.customer?.phone}</p>
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-bold text-gray-800 dark:text-gray-200">PKR {b.totalAmount?.toLocaleString()}</td>
                    <td className="p-4">{getStatusBadge(b.status)}</td>

                    {/* ── Floating Three-Dot Action Menu ── */}
                    <td className="p-4 text-center">
                      <BookingActionMenu
                        booking={b}
                        onEdit={handleEdit}
                        onViewScreenshot={(url) => setScreenshotUrl(url)}
                        onViewIdCards={(imgs) => { setIdCardImages(imgs); setActiveIdCardIndex(0); }}
                        onCashApprove={handleCashApprove}
                        onDelete={handleDelete}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fadeIn"
          onClick={() => setScreenshotUrl(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
              <h3 className="font-bold text-gray-800 dark:text-white text-lg">Payment Screenshot</h3>
              <button
                onClick={() => setScreenshotUrl(null)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl leading-none transition"
              >
                ✕
              </button>
            </div>
            <div className="p-4 flex justify-center bg-gray-100 dark:bg-gray-950 max-h-[70vh] overflow-auto">
              <img
                src={screenshotUrl}
                alt="Payment Screenshot"
                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow"
              />
            </div>
            <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 flex justify-end gap-3">
              <a
                href={screenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition"
              >
                Open Original
              </a>
              <button
                onClick={() => setScreenshotUrl(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-lg text-sm transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ID Cards Lightbox Modal ─────────────────────────────────── */}
      {idCardImages && idCardImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fadeIn"
          onClick={() => setIdCardImages(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
              <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                Customer ID Card Images ({activeIdCardIndex + 1} of {idCardImages.length})
              </h3>
              <button
                onClick={() => setIdCardImages(null)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl leading-none transition"
              >
                ✕
              </button>
            </div>

            <div className="p-4 flex flex-col items-center bg-gray-100 dark:bg-gray-950 max-h-[70vh] overflow-auto">
              <img
                src={idCardImages[activeIdCardIndex]}
                alt={`ID Card ${activeIdCardIndex + 1}`}
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow"
              />

              {/* Multi-image indicator & controls */}
              {idCardImages.length > 1 && (
                <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={() => setActiveIdCardIndex((prev) => (prev > 0 ? prev - 1 : idCardImages.length - 1))}
                    className="px-3 py-1.5 bg-gray-800 text-white text-xs font-bold rounded-lg hover:bg-gray-700 transition"
                  >
                    ‹ Previous
                  </button>
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                    {activeIdCardIndex + 1} / {idCardImages.length}
                  </span>
                  <button
                    onClick={() => setActiveIdCardIndex((prev) => (prev < idCardImages.length - 1 ? prev + 1 : 0))}
                    className="px-3 py-1.5 bg-gray-800 text-white text-xs font-bold rounded-lg hover:bg-gray-700 transition"
                  >
                    Next ›
                  </button>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 flex justify-end gap-3">
              <a
                href={idCardImages[activeIdCardIndex]}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-sm transition"
              >
                Open Full Size
              </a>
              <button
                onClick={() => setIdCardImages(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-lg text-sm transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageBookings;