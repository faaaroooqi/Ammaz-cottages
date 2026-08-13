import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import StorewideDiscountBanner from "../components/StorewideDiscountBanner";

/* ── Image Carousel ────────────────────────────────────────────── */
function ImageCarousel({ images, alt }) {
  const [current, setCurrent] = useState(0);
  const count = images.length;

  return (
    <div className="relative w-full h-full group overflow-hidden bg-slate-100 dark:bg-slate-800">
      {count > 0 ? (
        <img
          src={images[current]}
          alt={`${alt} ${current + 1}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 text-slate-400">
          <span className="text-5xl mb-1">🏡</span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">No Preview</span>
        </div>
      )}

      {count > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent((p) => (p - 1 + count) % count); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/60 hover:bg-slate-900/90 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-xs shadow-lg backdrop-blur-md"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent((p) => (p + 1) % count); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900/60 hover:bg-slate-900/90 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-xs shadow-lg backdrop-blur-md"
            aria-label="Next image"
          >
            ›
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrent(idx); }}
                className={`h-1.5 rounded-full transition-all ${
                  idx === current ? "bg-white w-4 shadow-sm" : "bg-white/50 hover:bg-white/80 w-1.5"
                }`}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {count > 1 && (
        <div className="absolute top-3.5 left-3.5 bg-slate-900/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow">
          📷 {current + 1}/{count}
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
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />

      <div
        className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-colors text-sm font-bold"
          aria-label="Close dialog"
        >
          ✕
        </button>

        <div className="w-16 h-16 mx-auto mb-5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {room && (
          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/50 px-3.5 py-1 rounded-full inline-block mb-3">
            {room.name}
          </span>
        )}

        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
          Sign In to Reserve
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed mb-6">
          Please sign in or create an account to unlock instant online room bookings and guest discounts.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/login")}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs py-3.5 rounded-2xl transition-all transform active:scale-95 border border-slate-200/60 dark:border-slate-700/60"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Public Rooms Component ──────────────────────────────────── */
function PublicRoomsList() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const processedRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    const q = searchQuery.toLowerCase().trim();
    return rooms.filter((r) => r.name?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));
  }, [rooms, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-24">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white pt-16 pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-5xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-indigo-200 text-xs font-black uppercase tracking-wider">
              Explore Guest Cottages & Suites
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4 text-white drop-shadow-md">
            Welcome to Ammaz Cottages
          </h1>
          <p className="text-lg text-indigo-200/80 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
            Discover luxury rooms and private suites. Sign in to start your reservation.
          </p>

          {/* Search Pill */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-3 sm:p-4 rounded-3xl sm:rounded-full shadow-2xl border border-white/40 dark:border-slate-700/60 max-w-xl mx-auto flex items-center px-4">
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-sm font-semibold focus:outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 relative z-20">
        <StorewideDiscountBanner />

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Available Rooms</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">Select a room to view details and book</p>
          </div>
          <span className="text-xs font-black bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 px-4 py-2 rounded-full">
            {processedRooms.length} options available
          </span>
        </div>

        {/* Room Grid */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-24 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading available rooms…</p>
          </div>
        ) : processedRooms.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-md border border-slate-200/80 dark:border-slate-800 p-16 text-center">
            <div className="text-6xl mb-4">🛏️</div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">No rooms available</h3>
            <p className="text-slate-500 text-sm font-medium">Please check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {processedRooms.map((room, idx) => (
              <div
                key={room._id}
                className="card-enter group bg-white dark:bg-slate-900 rounded-3xl shadow-sm hover:shadow-2xl border border-slate-200/70 dark:border-slate-800/80 flex flex-col overflow-hidden transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                style={{ animationDelay: `${idx * 0.06}s` }}
                onClick={() => setSelectedRoom(room)}
              >
                <div className="h-60 relative overflow-hidden">
                  <ImageCarousel images={room.images || []} alt={room.name} />
                  <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur-md border border-white/20 text-white px-3.5 py-1.5 rounded-2xl shadow-lg z-10">
                    <span className="text-xs font-black">PKR {Number(room.pricePerNight).toLocaleString()}</span>
                    <span className="text-[10px] text-slate-300 font-medium"> / night</span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">
                    {room.name}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-6">
                    {room.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center">
                    <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs py-3 rounded-2xl shadow-md group-hover:shadow-indigo-500/25 transition">
                      View Details & Reserve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

