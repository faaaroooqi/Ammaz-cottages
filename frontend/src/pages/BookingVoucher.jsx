import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import API from "../utils/api";

function BookingVoucher() {
  const { bookingId } = useParams();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await API.get(`/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBooking(res.data.booking);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load booking.");
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId, token]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-12 rounded-3xl shadow-sm border border-gray-100 max-w-md">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-3 text-gray-800">Booking Not Found</h2>
          <p className="text-gray-500 mb-6">{error || "This booking could not be loaded."}</p>
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

  const isPaid = ["confirmed", "cash_paid", "completed"].includes(booking.status);
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <>
      {/* Print-specific styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .voucher-card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 py-12 px-4 font-sans">
        {/* Action bar */}
        <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between no-print">
          <button
            onClick={() => navigate("/my-bookings")}
            className="flex items-center text-gray-500 hover:text-blue-600 font-medium transition"
          >
            <span className="mr-2">←</span> Back to My Bookings
          </button>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg flex items-center gap-2"
            >
              🖨️ Print / Download PDF
            </button>
          </div>
        </div>

        {/* Voucher Card */}
        <div className="voucher-card max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 text-center relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />
            <div className="text-sm uppercase tracking-[0.2em] text-blue-300 font-bold mb-2">
              Official Booking Voucher
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">🧾 Booking Receipt</h1>
            <p className="text-blue-200 text-sm font-medium">Guest House</p>

            <div className="mt-5 inline-block bg-white/10 border border-white/20 rounded-xl px-6 py-3 backdrop-blur-sm">
              <span className="text-xs text-blue-300 uppercase font-bold tracking-wider block">Booking ID</span>
              <span className="text-xl font-mono font-extrabold tracking-wider">{booking.bookingId}</span>
            </div>
          </div>

          {/* Body */}
          <div className="p-8 space-y-8">
            {/* Payment Status */}
            <div className="flex justify-center">
              {isPaid ? (
                <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-6 py-2.5 rounded-full text-sm font-bold">
                  ✅ Payment Confirmed
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-6 py-2.5 rounded-full text-sm font-bold">
                  ⏳ Payment Pending
                </span>
              )}
            </div>

            {/* Guest Information */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-3 pb-2 border-b-2 border-gray-100">
                Guest Information
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 space-y-3 border border-gray-100 dark:border-gray-700">
                <Row label="Guest Name" value={booking.customer?.name || "Guest"} />
                {booking.customer?.phone && <Row label="Phone" value={booking.customer.phone} />}
                {booking.customer?.email && <Row label="Email" value={booking.customer.email} />}
                {booking.customer?.cnic && <Row label="CNIC" value={booking.customer.cnic} />}
              </div>
            </div>

            {/* Reservation Details */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-3 pb-2 border-b-2 border-gray-100">
                Reservation Details
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 space-y-3 border border-gray-100 dark:border-gray-700">
                <Row label="Room" value={booking.room?.name || "Room"} />
                <Row label="Check-in" value={fmtDate(booking.checkIn)} />
                <Row label="Check-out" value={fmtDate(booking.checkOut)} />
                <Row label="Duration" value={`${booking.nights} Night${booking.nights > 1 ? "s" : ""}`} />
              </div>
            </div>

            {/* Total */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 text-center">
              <div className="text-xs uppercase tracking-[0.15em] text-blue-300 font-bold mb-1">Total Amount</div>
              <div className="text-4xl font-extrabold tracking-tight">
                PKR {Number(booking.totalAmount).toLocaleString()}
              </div>
              {isPaid && (
                <div className="mt-3 inline-block bg-green-500/20 text-green-300 px-4 py-1.5 rounded-full text-xs font-bold border border-green-400/30">
                  ✅ PAID
                </div>
              )}
            </div>

            {/* Note */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg px-5 py-4 text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
              📌 Please keep this voucher as your official booking receipt. You may be asked to present it at check-in.
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 dark:border-gray-800 px-8 py-5 text-center space-y-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-300 font-bold">
              Official Booking Voucher
            </p>
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Guest House. All rights reserved.
            </p>
            <p className="text-[10px] text-gray-300">
              Generated on {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* Detail row helper */
function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-right">{value}</span>
    </div>
  );
}

export default BookingVoucher;
