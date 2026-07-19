import { useState, useEffect } from "react";
import API from "../../utils/api";

function BookingModal({ isOpen, onClose, onSave, bookingData }) {
  const isEditing = !!bookingData;
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    roomId: "",
    status: "awaiting_payment",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    checkIn: "",
    checkOut: "",
    totalAmount: ""
  });

  useEffect(() => {
    if (isOpen) {
      loadRooms();
    }
  }, [isOpen]);

  const loadRooms = async () => {
    try {
      const res = await API.get("/rooms");
      setRooms(res.data.rooms);
    } catch (err) {
      console.error("Failed to load rooms", err);
    }
  };

  useEffect(() => {
    if (bookingData) {
      setFormData({
        roomId: bookingData.room?._id || "",
        status: bookingData.status || "awaiting_payment",
        customerName: bookingData.customer?.name || "",
        customerEmail: bookingData.customer?.email || "",
        customerPhone: bookingData.customer?.phone || "",
        checkIn: bookingData.checkIn ? new Date(bookingData.checkIn).toISOString().split('T')[0] : "",
        checkOut: bookingData.checkOut ? new Date(bookingData.checkOut).toISOString().split('T')[0] : "",
        totalAmount: bookingData.totalAmount || ""
      });
    } else {
      setFormData({
        roomId: "",
        status: "awaiting_payment",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        checkIn: "",
        checkOut: "",
        totalAmount: ""
      });
    }
  }, [bookingData, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      // Only send editable fields when editing
      onSave({
        totalAmount: formData.totalAmount ? Number(formData.totalAmount) : undefined,
        status: formData.status
      });
    } else {
      onSave({
        ...formData,
        totalAmount: formData.totalAmount ? Number(formData.totalAmount) : undefined
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-10">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg my-auto shadow-2xl border border-gray-100 dark:border-gray-800">
        <h2 className="text-2xl font-bold mb-5 text-gray-800 dark:text-white">
          {isEditing ? `Edit Booking ${bookingData?.bookingId}` : "Add New Booking"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* ─── EDITING MODE: Show read-only context + editable fields ─── */}
          {isEditing && (
            <>
              {/* Read-only Booking Context */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2 border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider mb-2">Booking Details (read-only)</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Room:</span>{" "}
                    <span className="font-bold text-gray-800 dark:text-gray-200">{bookingData.room?.name || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Booking ID:</span>{" "}
                    <span className="font-bold text-blue-600 dark:text-blue-400">{bookingData.bookingId}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Customer:</span>{" "}
                    <span className="font-bold text-gray-800 dark:text-gray-200">{bookingData.customer?.name || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Phone:</span>{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{bookingData.customer?.phone || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Email:</span>{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{bookingData.customer?.email || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">CNIC:</span>{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{bookingData.customer?.cnic || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Check-in:</span>{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {bookingData.checkIn ? new Date(bookingData.checkIn).toLocaleDateString() : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Check-out:</span>{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {bookingData.checkOut ? new Date(bookingData.checkOut).toLocaleDateString() : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Nights:</span>{" "}
                    <span className="font-bold text-gray-800 dark:text-gray-200">{bookingData.nights || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs font-bold uppercase text-green-600 dark:text-green-400 tracking-wider mb-3">Editable Fields</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Amount Received (PKR)</label>
                    <input
                      type="number"
                      name="totalAmount"
                      value={formData.totalAmount}
                      onChange={handleChange}
                      className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">Update if customer sent partial payment</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    >
                      <option value="awaiting_payment">Awaiting Payment</option>
                      <option value="confirmed_half_paid">Confirmed (Half Paid)</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ─── CREATE MODE: Full form ─── */}
          {!isEditing && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Select Room</label>
                <select
                  name="roomId"
                  value={formData.roomId}
                  onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  required
                >
                  <option value="">-- Choose a Room --</option>
                  {rooms.filter(r => r.isActive).map(r => (
                    <option key={r._id} value={r._id}>{r.name} (PKR {r.pricePerNight}/night)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  >
                    <option value="awaiting_payment">Awaiting Payment</option>
                    <option value="confirmed_half_paid">Confirmed (Half Paid)</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Customer Name</label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <input
                    type="text"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Check-in Date</label>
                  <input
                    type="date"
                    name="checkIn"
                    value={formData.checkIn}
                    onChange={handleChange}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Check-out Date</label>
                  <input
                    type="date"
                    name="checkOut"
                    value={formData.checkOut}
                    onChange={handleChange}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    required
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 italic pt-2">
                Note: The total amount will be calculated automatically based on the selected room and dates.
              </p>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold shadow-md"
            >
              {isEditing ? "Save Changes" : "Create Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingModal;
