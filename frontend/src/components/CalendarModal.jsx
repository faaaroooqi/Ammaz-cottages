import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { eachDayOfInterval } from "date-fns";
import API from "../utils/api";

function CalendarModal({ room, onClose, onContinue }) {
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("checkIn");

  useEffect(() => {
    const fetchDates = async () => {
      try {
        const res = await API.get(`/bookings/room/${room._id}/dates`);
        const ranges = res.data.dates;
        let excluded = [];
        ranges.forEach(range => {
          const datesInInterval = eachDayOfInterval({
            start: new Date(range.checkIn),
            end: new Date(range.checkOut)
          });
          excluded = [...excluded, ...datesInInterval];
        });
        setBookedDates(excluded);
      } catch (err) {
        console.error("Failed to fetch booked dates", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDates();
  }, [room]);

  const calcNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diff = Math.ceil(Math.abs(checkOut - checkIn) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-overlay-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative animate-modal-in border border-slate-200/80 dark:border-slate-800 font-sans">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-colors text-xs font-bold"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/50 px-3 py-1 rounded-full text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 mb-3">
            <span>📅 {room.name}</span>
          </div>

          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {step === "checkIn" ? "Select Arrival Date" : "Select Departure Date"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {step === "checkIn" 
              ? "Choose check-in arrival date." 
              : "Choose check-out departure date."}
          </p>
        </div>

        {/* Stepper Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6 text-xs font-bold">
          <span className={`px-3 py-1 rounded-full ${step === "checkIn" ? "bg-indigo-600 text-white" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"}`}>
            1. Arrival {checkIn ? `✓ ${checkIn.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ""}
          </span>
          <span className="text-slate-300">➔</span>
          <span className={`px-3 py-1 rounded-full ${step === "checkOut" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}>
            2. Departure {checkOut ? `✓ ${checkOut.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ""}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 custom-datepicker-wrapper">
              {step === "checkIn" ? (
                <DatePicker
                  selected={checkIn}
                  onChange={(date) => {
                    setCheckIn(date);
                    if (checkOut && date >= checkOut) {
                      setCheckOut(null);
                    }
                    setTimeout(() => setStep("checkOut"), 150);
                  }}
                  selectsStart
                  startDate={checkIn}
                  endDate={checkOut}
                  minDate={new Date()}
                  excludeDates={bookedDates}
                  inline
                />
              ) : (
                <DatePicker
                  selected={checkOut}
                  onChange={(date) => setCheckOut(date)}
                  selectsEnd
                  startDate={checkIn}
                  endDate={checkOut}
                  minDate={checkIn || new Date()}
                  excludeDates={bookedDates}
                  inline
                />
              )}
            </div>

            {/* Night Summary Banner */}
            {checkIn && checkOut && (
              <div className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 p-3 rounded-2xl text-center text-xs font-black text-indigo-700 dark:text-indigo-300">
                ✨ Duration: {calcNights()} {calcNights() === 1 ? 'Night' : 'Nights'} Stay
              </div>
            )}

            <div className="flex gap-3">
              {step === "checkOut" && (
                <button
                  onClick={() => setStep("checkIn")}
                  className="w-1/3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-wider py-3.5 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Back
                </button>
              )}
              <button
                onClick={() => onContinue(checkIn, checkOut)}
                disabled={!checkIn || !checkOut || step === "checkIn"}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-2xl shadow-md hover:shadow-indigo-500/25 transition disabled:opacity-50"
              >
                Continue to Details
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-datepicker-wrapper .react-datepicker {
          border: none;
          background: transparent;
          font-family: inherit;
        }
        .custom-datepicker-wrapper .react-datepicker__header {
          background: transparent;
          border-bottom: none;
        }
        .custom-datepicker-wrapper .react-datepicker__day--selected,
        .custom-datepicker-wrapper .react-datepicker__day--in-selecting-range,
        .custom-datepicker-wrapper .react-datepicker__day--in-range {
          background-color: #4f46e5 !important;
          border-radius: 0.5rem;
        }
        .custom-datepicker-wrapper .react-datepicker__day:hover {
          border-radius: 0.5rem;
        }
        .custom-datepicker-wrapper .react-datepicker__current-month,
        .custom-datepicker-wrapper .react-datepicker-time__header,
        .custom-datepicker-wrapper .react-datepicker-year-header {
          color: inherit;
        }
        .custom-datepicker-wrapper .react-datepicker__day-name {
          color: #64748b;
        }
        .dark .custom-datepicker-wrapper .react-datepicker__day-name {
          color: #94a3b8;
        }
        .dark .custom-datepicker-wrapper .react-datepicker__day {
          color: #f1f5f9;
        }
        .dark .custom-datepicker-wrapper .react-datepicker__day--disabled {
          color: #475569;
        }
        .dark .custom-datepicker-wrapper .react-datepicker__current-month {
          color: #f8fafc;
        }
        .custom-datepicker-wrapper .react-datepicker__navigation-icon::before {
          border-color: #64748b;
        }
        .dark .custom-datepicker-wrapper .react-datepicker__navigation-icon::before {
          border-color: #94a3b8;
        }
      `}</style>
    </div>
  );
}

export default CalendarModal;

