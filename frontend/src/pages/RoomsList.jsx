import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import CalendarModal from "../components/CalendarModal";
import RoomDetailsModal from "../components/RoomDetailsModal";
import StorewideDiscountBanner from "../components/StorewideDiscountBanner";

/* ── Image Carousel ────────────────────────────────────────────── */
function ImageCarousel({ images, alt, onFavorite, isFavorite }) {
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

      {/* Wishlist Heart Toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFavorite && onFavorite();
        }}
        className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur-md flex items-center justify-center text-white transition-all transform active:scale-90 shadow-md"
        title={isFavorite ? "Saved to wishlist" : "Save to wishlist"}
      >
        <svg
          className={`w-5 h-5 transition-colors ${
            isFavorite ? "text-rose-500 fill-rose-500" : "text-white fill-none stroke-current"
          }`}
          viewBox="0 0 24 24"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>

      {/* Navigation Arrows */}
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

          {/* Indicators */}
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

      {/* Image Counter Badge */}
      {count > 1 && (
        <div className="absolute top-3.5 left-3.5 bg-slate-900/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow">
          📷 {current + 1}/{count}
        </div>
      )}
    </div>
  );
}

/* ── Categories Bar Data ───────────────────────────────────────── */
const CATEGORIES = [
  { id: "all", label: "All Stays", icon: "✨" },
  { id: "deluxe", label: "Deluxe Cottages", icon: "👑" },
  { id: "family", label: "Family Suites", icon: "🏡" },
  { id: "mountain", label: "Mountain View", icon: "🏔️" },
  { id: "pool", label: "Poolside Access", icon: "🏊" },
  { id: "wifi", label: "High-Speed Wi-Fi", icon: "⚡" },
];

/* ── Sort Options ──────────────────────────────────────────────── */
const SORT_OPTIONS = [
  { value: "default", label: "Featured & Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating-desc", label: "Top Rated" },
  { value: "name-asc", label: "Name: A → Z" },
];

function RoomsList() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [favorites, setFavorites] = useState({});
  const [showCalendarModal, setShowCalendarModal] = useState(null);
  const [selectedRoomDetails, setSelectedRoomDetails] = useState(null);

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

  const toggleFavorite = (id) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter & Sort Logic
  const processedRooms = useMemo(() => {
    let result = [...rooms];

    // Category filter
    if (selectedCategory !== "all") {
      const cat = selectedCategory.toLowerCase();
      result = result.filter((room) => {
        const text = `${room.name} ${room.description} ${room.type || ""} ${room.facilities?.join(" ")}`.toLowerCase();
        if (cat === "deluxe") return text.includes("deluxe") || text.includes("suite");
        if (cat === "family") return text.includes("family") || (room.capacity && room.capacity >= 4);
        if (cat === "mountain") return text.includes("mountain") || text.includes("view") || text.includes("balcony");
        if (cat === "pool") return text.includes("pool");
        if (cat === "wifi") return room.facilities?.some((f) => f.toLowerCase().includes("wifi") || f.toLowerCase().includes("internet"));
        return true;
      });
    }

    // Search query filter
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
      case "price-asc":
        result.sort((a, b) => (a.pricePerNight || 0) - (b.pricePerNight || 0));
        break;
      case "price-desc":
        result.sort((a, b) => (b.pricePerNight || 0) - (a.pricePerNight || 0));
        break;
      case "rating-desc":
        result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case "name-asc":
        result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      default:
        break;
    }

    return result;
  }, [rooms, searchQuery, selectedCategory, sortBy]);

  const handleBookNow = (room) => {
    setShowCalendarModal(room);
  };

  const handleCalendarContinue = (checkIn, checkOut) => {
    const room = showCalendarModal;
    setShowCalendarModal(null);
    navigate(`/rooms/${room._id}/book`, {
      state: { room, checkIn, checkOut },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-24">
      
      {/* Hero & Search Header */}
      <div className="relative bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white pt-16 pb-32 px-6 overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-5xl mx-auto text-center z-10">
          
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-indigo-200 text-xs font-black uppercase tracking-wider">
              {rooms.length} Premium Rooms Available
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4 text-white drop-shadow-md">
            Find Your Dream Resort Stay
          </h1>
          <p className="text-lg text-indigo-200/80 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
            Book handpicked luxury rooms, private cottages, and mountain suites with instant confirmation.
          </p>

          {/* Airbnb / Booking.com Style Floating Search Pill Widget */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-3 sm:p-4 rounded-3xl sm:rounded-full shadow-2xl border border-white/40 dark:border-slate-700/60 max-w-4xl mx-auto text-slate-800 dark:text-slate-100 flex flex-col sm:flex-row items-center gap-3">
            
            {/* Search Input */}
            <div className="flex-1 w-full relative flex items-center px-4 py-2 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by room name, feature, or amenities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-sm font-semibold focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold bg-slate-200 dark:bg-slate-700 rounded-full w-5 h-5 flex items-center justify-center shrink-0 ml-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="w-full sm:w-48 px-4 py-2 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700">
              <label className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-transparent text-xs font-extrabold focus:outline-none cursor-pointer border-none p-0 text-slate-800 dark:text-slate-200"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Button */}
            <button
              onClick={() => {}}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-full shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all transform active:scale-95 shrink-0 flex items-center justify-center gap-2"
            >
              <span>Search</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 relative z-20">
        
        {/* Category Pill Bar (Airbnb Style Horizontal Scrolling) */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-3 shadow-lg mb-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-1 px-1">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shrink-0 ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-105"
                      : "bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Storewide Discounts Callout */}
        <StorewideDiscountBanner />

        {/* Header Results Counter */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {searchQuery || selectedCategory !== "all" ? "Filtered Stays" : "All Available Rooms"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">
              Handcrafted for ultimate guest comfort and luxury
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-black bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 px-4 py-2 rounded-full shadow-sm">
              {processedRooms.length} {processedRooms.length === 1 ? "room" : "rooms"} available
            </span>
          </div>
        </div>

        {/* Rooms Grid */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-24 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading available rooms…</p>
          </div>
        ) : processedRooms.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-md border border-slate-200/80 dark:border-slate-800 p-16 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">No matching rooms found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6">
              Try adjusting your search terms or category selection.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {processedRooms.map((room, idx) => {
              const isFav = !!favorites[room._id];
              return (
                <div
                  key={room._id}
                  onClick={() => setSelectedRoomDetails(room)}
                  className="card-enter group bg-white dark:bg-slate-900 rounded-3xl shadow-sm hover:shadow-2xl border border-slate-200/70 dark:border-slate-800/80 flex flex-col overflow-hidden transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                  style={{ animationDelay: `${idx * 0.06}s` }}
                >
                  {/* Photo Gallery Header */}
                  <div className="h-60 relative overflow-hidden">
                    <ImageCarousel
                      images={room.images || []}
                      alt={room.name}
                      onFavorite={() => toggleFavorite(room._id)}
                      isFavorite={isFav}
                    />

                    {/* Price Tag Overlay */}
                    <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur-md border border-white/20 text-white px-3.5 py-1.5 rounded-2xl shadow-lg z-10">
                      <span className="text-xs font-black">PKR {Number(room.pricePerNight).toLocaleString()}</span>
                      <span className="text-[10px] text-slate-300 font-medium"> / night</span>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-6 flex flex-col flex-1">
                    
                    {/* Title & Rating */}
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                        {room.name}
                      </h3>
                      <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 px-2 py-0.5 rounded-lg shrink-0">
                        <span className="text-amber-500 text-xs">⭐</span>
                        <span className="text-xs font-black text-amber-700 dark:text-amber-300">
                          {room.averageRating ? Number(room.averageRating).toFixed(1) : "New"}
                        </span>
                      </div>
                    </div>

                    {/* Specs / Capacity */}
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                      <span>👥 Up to {room.capacity || 2} Guests</span>
                      <span>•</span>
                      <span>{room.type || "Resort Room"}</span>
                    </p>

                    {/* Description preview */}
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {room.description || "Luxury guest suite with modern amenities."}
                    </p>

                    {/* Facility Tags */}
                    {room.facilities && room.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {room.facilities.slice(0, 3).map((fac, fidx) => (
                          <span
                            key={fidx}
                            className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60"
                          >
                            {fac}
                          </span>
                        ))}
                        {room.facilities.length > 3 && (
                          <span className="text-[10px] font-bold text-slate-400 self-center">
                            +{room.facilities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookNow(room);
                        }}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs py-3 rounded-2xl shadow-md hover:shadow-indigo-500/25 transition-all transform active:scale-95"
                      >
                        Reserve Now
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRoomDetails(room);
                        }}
                        className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl transition"
                        title="View Full Details & Reviews"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Date Range Modal */}
      {showCalendarModal && (
        <CalendarModal
          room={showCalendarModal}
          onClose={() => setShowCalendarModal(null)}
          onContinue={handleCalendarContinue}
        />
      )}

      {/* Room Details Showcase Modal */}
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

