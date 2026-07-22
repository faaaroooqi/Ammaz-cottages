import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import { showError } from "../utils/toast";
import CalendarModal from "../components/CalendarModal";
import RoomDetailsModal from "../components/RoomDetailsModal";
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

      {/* Prev / Next */}
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

          {/* Dot indicators */}
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

      {/* Image count badge */}
      {count > 1 && (
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-bold shadow">
          {current + 1}/{count}
        </div>
      )}
    </div>
  );
}

/* ── Sort Options ─────────────────────────────────────────────────── */
const SORT_OPTIONS = [
  { value: "default",     label: "Default" },
  { value: "name-asc",    label: "Name: A → Z" },
  { value: "name-desc",   label: "Name: Z → A" },
  { value: "price-asc",   label: "Price: Low → High" },
  { value: "price-desc",  label: "Price: High → Low" },
];

/* ── Main Component ───────────────────────────────────────────────── */
function RoomsList() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [showCalendarModal, setShowCalendarModal] = useState(null);
  const [selectedRoomDetails, setSelectedRoomDetails] = useState(null);

  const [filters, setFilters] = useState({
    checkIn: "",
    checkOut: "",
  });

  // ✅ Fetch all rooms
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

  // ✅ Handle date inputs
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // ✅ Filtered & sorted rooms (client-side)
  const processedRooms = useMemo(() => {
    let result = [...rooms];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((room) => {
        const nameMatch = room.name?.toLowerCase().includes(q);
        const descMatch = room.description?.toLowerCase().includes(q);
        const facilityMatch = room.facilities?.some((f) => f.toLowerCase().includes(q));
        return nameMatch || descMatch || facilityMatch;
      });
    }

    // Sort
    switch (sortBy) {
      case "name-asc":
        result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "name-desc":
        result.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
        break;
      case "price-asc":
        result.sort((a, b) => (a.pricePerNight || 0) - (b.pricePerNight || 0));
        break;
      case "price-desc":
        result.sort((a, b) => (b.pricePerNight || 0) - (a.pricePerNight || 0));
        break;
      default:
        break;
    }

    return result;
  }, [rooms, searchQuery, sortBy]);

  // ✅ Book room
  const handleBookNow = (room) => {
    setShowCalendarModal(room);
  };

  const handleCalendarContinue = (checkIn, checkOut) => {
    const room = showCalendarModal;
    setShowCalendarModal(null);
    navigate(`/rooms/${room._id}/book`, {
      state: {
        room,
        checkIn,
        checkOut,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-blue-800 to-blue-900 pt-28 pb-44 px-6 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-5xl mx-auto text-center z-10">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-blue-100 text-sm font-semibold">{rooms.length} rooms available</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight drop-shadow-md">
            Find Your Perfect Stay
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto drop-shadow leading-relaxed">
            Experience luxury and comfort in our handpicked rooms. Book your next unforgettable get away today.
          </p>

          {/* ── Glassmorphic Filter Bar ──────────────────────────────────── */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 md:p-6 rounded-3xl shadow-2xl w-full max-w-4xl mx-auto">
            {/* Row 1: Search + Sort */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              {/* Search bar */}
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search rooms, facilities…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/95 text-gray-800 border-0 pl-12 pr-4 py-3.5 rounded-xl shadow-inner focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all font-medium placeholder-gray-400"
                  id="room-search"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-500 text-xs transition-colors"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Sort dropdown */}
              <div className="sm:w-52">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-white/95 text-gray-800 border-0 p-3.5 rounded-xl shadow-inner focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all font-medium appearance-none cursor-pointer"
                  id="room-sort"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                    backgroundSize: "18px",
                    paddingRight: "40px",
                  }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-16 -mt-20 relative z-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
          <div>
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-sm mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-800 via-indigo-700 to-purple-700 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                {searchQuery ? "Search Results" : "Available Rooms"}
              </span>
            </h2>
            {searchQuery ? (
              <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium text-sm">
                Showing results for "<span className="text-blue-600 dark:text-blue-400 font-bold">{searchQuery}</span>"
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
                Discover luxury and comfort in our handpicked rooms
              </p>
            )}
          </div>
          {processedRooms.length > 0 && (
            <span className="text-gray-600 dark:text-gray-300 font-bold bg-white dark:bg-gray-800 px-5 py-2.5 rounded-full shadow-sm text-sm border border-gray-100 dark:border-gray-700 whitespace-nowrap">
              {processedRooms.length} {processedRooms.length === 1 ? "option" : "options"} found
            </span>
          )}
        </div>

        {/* Storewide Discounts Banner */}
        <StorewideDiscountBanner />

        {/* Rooms Grid */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-24 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-400 font-medium text-sm">Loading rooms…</p>
          </div>
        ) : processedRooms.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-16 text-center">
            <div className="text-6xl mb-4">{searchQuery ? "🔍" : "🛏️"}</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {searchQuery ? "No rooms match your search" : "No rooms available"}
            </h3>
            <p className="text-gray-500">
              {searchQuery ? "Try a different search term or clear the filter." : "Try adjusting your dates or check back later."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-6 px-6 py-2.5 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-colors text-sm"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {processedRooms.map((room, idx) => (
              <div
                key={room._id}
                onClick={() => setSelectedRoomDetails(room)}
                className="cursor-pointer card-enter group bg-white dark:bg-gray-900 rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden transition-all duration-300 transform hover:-translate-y-2"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                {/* Room Image with Carousel */}
                <div className="h-56 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                  <ImageCarousel
                    images={room.images || []}
                    alt={room.name}
                  />
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-extrabold text-indigo-900 shadow-sm border border-white/50 z-10">
                    PKR {room.pricePerNight} <span className="text-gray-500 font-medium text-xs">/ night</span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {room.name}
                  </h3>

                  {/* Reviews Summary */}
                  <div className="flex items-center gap-1 mb-3">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      {room.averageRating ? room.averageRating : "New"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      ({room.reviewCount || 0} {room.reviewCount === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>

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

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleBookNow(room); }}
                        className="flex-1 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-bold py-3.5 rounded-xl hover:from-blue-600 hover:to-indigo-600 shadow-md hover:shadow-lg transition-all duration-300 transform active:scale-95"
                      >
                        Book Now
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedRoomDetails(room); }}
                        className="p-3.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:from-blue-600 hover:to-indigo-600 rounded-xl transition-all duration-300 transform active:scale-95 flex items-center justify-center shadow-md hover:shadow-lg"
                        title="View Details & Reviews"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCalendarModal && (
        <CalendarModal
          room={showCalendarModal}
          onClose={() => setShowCalendarModal(null)}
          onContinue={handleCalendarContinue}
        />
      )}

      {selectedRoomDetails && (
        <RoomDetailsModal
          room={selectedRoomDetails}
          onClose={() => setSelectedRoomDetails(null)}
          onBookNow={(r) => {
            setSelectedRoomDetails(null);
            handleBookNow(r);
          }}
        />
      )}
    </div>
  );
}

export default RoomsList;
