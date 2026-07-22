import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import StorewideDiscountBanner from "../components/StorewideDiscountBanner";

/* ── Tiny Image Carousel ──────────────────────────────────────────── */
function ImageCarousel({ images, alt }) {
  const [current, setCurrent] = useState(0);
  const count = images.length;

  if (count === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center opacity-30 bg-indigo-50">
        <span className="text-6xl">🏨</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group">
      <img
        src={images[current]}
        alt={`${alt} ${current + 1}`}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {count > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent((p) => (p - 1 + count) % count); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70 text-sm shadow-lg"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent((p) => (p + 1) % count); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70 text-sm shadow-lg"
            aria-label="Next image"
          >
            ›
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrent(idx); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === current ? "bg-white w-4 shadow-md" : "bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {count > 1 && (
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-bold shadow">
          {current + 1}/{count}
        </div>
      )}
    </div>
  );
}

/* ── Sign-In Required Modal ───────────────────────────────────────── */
function SignInModal({ room, onClose }) {
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-overlay-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className="relative bg-white/90 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-2xl max-w-md w-full p-10 text-center animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors text-lg"
          aria-label="Close dialog"
        >
          ×
        </button>

        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg animate-float">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {/* Room name */}
        {room && (
          <p className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full inline-block mb-4">
            {room.name}
          </p>
        )}

        {/* Message */}
        <h3 className="text-2xl font-extrabold text-gray-900 mb-3 tracking-tight">
          Sign In Required
        </h3>
        <p className="text-gray-500 font-medium leading-relaxed mb-8">
          Please sign in or create an account to book your favorite destination.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/login")}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-95"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="flex-1 bg-white border-2 border-gray-200 hover:border-indigo-300 text-gray-700 hover:text-indigo-600 font-bold py-3.5 rounded-xl shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────── */
function PublicRoomsList() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await API.get("/rooms");
      setRooms(res.data.rooms || []);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-blue-800 to-blue-900 pt-28 pb-36 px-6 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-5xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-blue-100 text-sm font-semibold">Browse our collection</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight drop-shadow-md">
            Explore Our Rooms
          </h1>
          <p className="text-xl text-blue-100 mb-4 max-w-2xl mx-auto drop-shadow leading-relaxed">
            Discover luxury and comfort in our handpicked rooms. Sign in to book your next unforgettable getaway.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16 -mt-16 relative z-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-800 via-indigo-700 to-purple-700 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                Available Rooms
              </span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Click on any room to learn more</p>
          </div>
          {rooms.length > 0 && (
            <span className="text-gray-600 dark:text-gray-300 font-bold bg-white dark:bg-gray-800 px-5 py-2.5 rounded-full shadow-sm text-sm border border-gray-100 dark:border-gray-700">
              {rooms.length} {rooms.length === 1 ? "room" : "rooms"} available
            </span>
          )}
        </div>

        <StorewideDiscountBanner />

        {/* Room Grid */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-24 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-400 font-medium text-sm">Loading rooms…</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-16 text-center">
            <div className="text-6xl mb-4">🛏️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No rooms available</h3>
            <p className="text-gray-500">Check back later for new listings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room, idx) => (
              <div
                key={room._id}
                className="card-enter group bg-white dark:bg-gray-900 rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                style={{ animationDelay: `${idx * 0.08}s` }}
                onClick={() => setSelectedRoom(room)}
              >
                {/* Room Image */}
                <div className="h-56 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                  <ImageCarousel images={room.images || []} alt={room.name} />
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-extrabold text-indigo-900 shadow-sm border border-white/50 z-10">
                    PKR {room.pricePerNight} <span className="text-gray-500 font-medium text-xs">/ night</span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {room.name}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 line-clamp-2 leading-relaxed">
                    {room.description}
                  </p>

                  <div className="mt-auto">
                    {room.facilities && room.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {room.facilities.slice(0, 3).map((f, fidx) => (
                          <span key={fidx} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md text-xs font-bold border border-indigo-100/50">
                            {f}
                          </span>
                        ))}
                        {room.facilities.length > 3 && (
                          <span className="bg-gray-50 text-gray-500 px-3 py-1 rounded-md text-xs font-bold border border-gray-100">
                            +{room.facilities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white font-bold py-3.5 rounded-xl text-center group-hover:from-blue-600 group-hover:to-indigo-600 shadow-md group-hover:shadow-lg transition-all duration-300">
                      View Details
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sign-in Modal */}
      {selectedRoom && (
        <SignInModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
}

export default PublicRoomsList;
