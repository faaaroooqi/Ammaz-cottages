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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="text-center bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Voucher Unavailable</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-6">{error || "Reservation details could not be retrieved."}</p>
          <button
            onClick={() => navigate("/my-bookings")}
            className="w-full py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md transition"
          >
            Back to Reservations
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
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .voucher-card { box-shadow: none !important; border: 1px solid #cbd5e1 !important; }
        }
      `}</style>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 font-sans">
        
        {/* Header Action Bar */}
        <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between no-print">
          <button
            onClick={() => navigate("/my-bookings")}
            className="inline-flex items-center text-xs font-black text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-full shadow-sm transition"
          >
            ← Back to My Reservations
          </button>
          <button
            onClick={handlePrint}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-full shadow-lg shadow-indigo-500/20 transition flex items-center gap-2"
          >
            🖨️ Print / Save PDF Pass
          </button>
        </div>

        {/* Digital Boarding Pass Voucher Card */}
        <div className="voucher-card max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
          
          {/* Header Pass Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            
            <div className="text-[10px] uppercase tracking-[0.25em] text-indigo-300 font-black mb-2">
              Official Guest House Reservation Pass
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-1">Ammaz Cottages Voucher</h1>
            <p className="text-xs text-indigo-200/80 font-medium">Verified Digital Guest Pass</p>

            <div className="mt-6 inline-flex flex-col items-center bg-white/10 border border-white/20 rounded-2xl px-8 py-3 backdrop-blur-md">
              <span className="text-[10px] text-indigo-300 uppercase font-black tracking-widest mb-0.5">Booking Reference ID</span>
              <span className="text-2xl font-mono font-black tracking-wider text-white">{booking.bookingId}</span>
            </div>
          </div>

          {/* Pass Body Info */}
          <div className="p-8 space-y-6">
            
            {/* Status Pill */}
            <div className="flex justify-center">
              {isPaid ? (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider">
                  ✅ Reservation Confirmed & Paid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider">
                  ⏳ Verification Pending
                </span>
              )}
            </div>

            {/* Guest Details Box */}
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                Primary Guest Registration
              </h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 space-y-2 border border-slate-200/60 dark:border-slate-700/60">
                <Row label="Guest Name" value={booking.customer?.name || "Guest"} />
                {booking.customer?.phone && <Row label="Contact Phone" value={booking.customer.phone} />}
                {booking.customer?.email && <Row label="Registered Email" value={booking.customer.email} />}
                {booking.customer?.cnic && <Row label="CNIC / Passport" value={booking.customer.cnic} />}
              </div>
            </div>

            {/* Room Reservation Details */}
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                Stay Particulars
              </h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 space-y-2 border border-slate-200/60 dark:border-slate-700/60">
                <Row label="Reserved Room" value={booking.room?.name || "Suite"} />
                <Row label="Check-in Date" value={fmtDate(booking.checkIn)} />
                <Row label="Check-out Date" value={fmtDate(booking.checkOut)} />
                <Row label="Duration" value={`${booking.nights} Night${booking.nights > 1 ? "s" : ""}`} />
              </div>
            </div>

            {/* Total Paid Box */}
            <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 text-center">
              <span className="text-[10px] uppercase tracking-widest text-indigo-300 font-black block mb-1">Grand Total Amount</span>
              <div className="text-3xl font-black tracking-tight text-white">
                PKR {Number(booking.totalAmount).toLocaleString()}
              </div>
            </div>

            {/* Check-in note */}
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 rounded-2xl p-4 text-xs text-indigo-800 dark:text-indigo-300 font-medium leading-relaxed">
              📌 Present this digital voucher pass along with your original CNIC / Passport at resort check-in desk.
            </div>

          </div>

          {/* Footer Bar */}
          <div className="border-t border-slate-100 dark:border-slate-800 px-8 py-4 text-center space-y-1 bg-slate-50/50 dark:bg-slate-900/50">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">
              Ammaz Cottages Official Voucher Pass
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              Generated on {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

        </div>
      </div>
    </>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-slate-200/40 dark:border-slate-700/40 last:border-b-0">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-xs font-black text-slate-900 dark:text-slate-100 text-right">{value}</span>
    </div>
  );
}

export default BookingVoucher;

