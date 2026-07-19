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

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-overlay-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full p-8 relative animate-modal-in border border-gray-100 dark:border-gray-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors text-lg"
        >
          &times;
        </button>

        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {step === "checkIn" ? "Check-in Date" : "Check-out Date"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">
            {step === "checkIn" 
              ? `Select your arrival date for ${room.name}.` 
              : `Select your departure date for ${room.name}.`}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 custom-datepicker-wrapper">
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

            <div className="flex gap-3">
              {step === "checkOut" && (
                <button
                  onClick={() => setStep("checkIn")}
                  className="w-1/3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-bold py-3.5 rounded-xl shadow-sm hover:shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-all transform hover:-translate-y-0.5 active:scale-95"
                >
                  Back
                </button>
              )}
              <button
                onClick={() => onContinue(checkIn, checkOut)}
                disabled={!checkIn || !checkOut || step === "checkIn"}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all transform hover:-translate-y-0.5 active:scale-95"
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
          background-color: #2563eb !important;
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
          color: #6b7280;
        }
        .dark .custom-datepicker-wrapper .react-datepicker__day-name {
          color: #9ca3af;
        }
        .dark .custom-datepicker-wrapper .react-datepicker__day {
          color: #e5e7eb;
        }
        .dark .custom-datepicker-wrapper .react-datepicker__day--disabled {
          color: #4b5563;
        }
        .dark .custom-datepicker-wrapper .react-datepicker__current-month {
          color: #f3f4f6;
        }
        .custom-datepicker-wrapper .react-datepicker__navigation-icon::before {
          border-color: #6b7280;
        }
        .dark .custom-datepicker-wrapper .react-datepicker__navigation-icon::before {
          border-color: #9ca3af;
        }
      `}</style>
    </div>
  );
}

export default CalendarModal;
