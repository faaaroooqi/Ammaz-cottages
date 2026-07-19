import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../utils/api";
import { showSuccess } from "../utils/toast";

function BookingForm({ onBookingSuccess }) {
  const { user, theme } = useContext(AuthContext);

  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* Fetch available rooms */
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await API.get("/rooms");
        setRooms(res.data.rooms || res.data);
      } catch (err) {
        setError("Failed to load rooms ❌");
      }
    };
    fetchRooms();
  }, []);

  /* Booking submit */
  const handleBooking = async (e) => {
    e.preventDefault();
    setError("");

    if (!roomId || !checkIn || !checkOut) {
      return setError("All fields are required ❗");
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      return setError("Check-out must be after check-in ❌");
    }

    setLoading(true);

    try {
      const res = await API.post(
        "/bookings",
        {
          room: roomId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          guests,
          notes,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      showSuccess("Booking created successfully!");

      // reset form
      setRoomId("");
      setCheckIn("");
      setCheckOut("");
      setGuests(1);
      setNotes("");

      onBookingSuccess?.(res.data.booking);
    } catch (err) {
      setError(err.response?.data?.message || "Booking failed ❌");
    }

    setLoading(false);
  };

  return (
    <div
      className={`max-w-xl mx-auto p-6 rounded shadow
      ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}`}
    >
      <h2 className="text-2xl font-bold mb-4">Book a Room</h2>

      {error && <p className="text-red-500 mb-3">{error}</p>}

      {/* User Info */}
      <div className="flex items-center space-x-2 mb-4">
        <img
          src={user?.profilePic || "https://placehold.co/40x40"}
          className="w-10 h-10 rounded-full border"
          alt="user"
        />
        <span className="font-semibold">{user?.name || user?.email}</span>
      </div>

      <form onSubmit={handleBooking} className="space-y-4">
        {/* Room Select */}
        <div>
          <label className="block font-semibold mb-1">Room</label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full border rounded p-2 text-black"
          >
            <option value="">Select a room</option>
            {rooms.map((room) => (
              <option key={room._id} value={room._id}>
                {room.title || room.roomNumber} — Rs.{room.pricePerNight}/night
              </option>
            ))}
          </select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Check-in</label>
            <input
              type="date"
              value={checkIn}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full border rounded p-2 text-black"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Check-out</label>
            <input
              type="date"
              value={checkOut}
              min={checkIn}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full border rounded p-2 text-black"
            />
          </div>
        </div>

        {/* Guests */}
        <div>
          <label className="block font-semibold mb-1">Guests</label>
          <input
            type="number"
            min={1}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full border rounded p-2 text-black"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block font-semibold mb-1">
            Special Requests (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="3"
            className="w-full border rounded p-2 text-black"
          />
        </div>

        {/* Submit */}
        <button
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Booking..." : "Confirm Booking"}
        </button>
      </form>
    </div>
  );
}

export default BookingForm;
