import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function RoomCard({
  room,
  onDelete,
  onEdit,
  showAdminActions = false,
}) {
  const { theme, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);

  const isAdmin = user?.role === "admin";

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentIndex < room.images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <div
      className={`p-4 rounded shadow transition-colors duration-300
      ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}
      max-w-xl mx-auto`}
    >
      {/* Room Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-xl font-bold">{room.title}</h3>
          <p className="text-sm text-gray-500">
            Max Guests: {room.maxGuests}
          </p>
        </div>

        {/* Admin Controls */}
        {showAdminActions && isAdmin && (
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(room)}
              className="bg-yellow-500 px-2 py-1 text-white rounded hover:bg-yellow-600"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(room._id)}
              className="bg-red-500 px-2 py-1 text-white rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Room Images Slider */}
      {room.images?.length > 0 && (
        <div className="relative flex items-center justify-center mb-3">
          <img
            src={room.images[currentIndex]}
            alt={`room-${currentIndex}`}
            className="rounded-lg max-h-80 w-full object-cover"
          />

          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-2 bg-black/60 text-white px-2 py-1 rounded-full"
            >
              ⬅
            </button>
          )}

          {currentIndex < room.images.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-2 bg-black/60 text-white px-2 py-1 rounded-full"
            >
              ➡
            </button>
          )}
        </div>
      )}

      {/* Description */}
      <p className="mb-3 text-sm">{room.description}</p>

      {/* Pricing & Status */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <p className="text-lg font-semibold">
            PKR {room.pricePerNight} / night
          </p>
          <p
            className={`text-sm font-semibold ${
              room.isAvailable
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {room.isAvailable ? "Available" : "Booked"}
          </p>
        </div>

        {/* Book CTA */}
        {room.isAvailable && (
          <button
            onClick={() => navigate(`/book/${room._id}`)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Book Now
          </button>
        )}
      </div>
    </div>
  );
}

export default RoomCard;
