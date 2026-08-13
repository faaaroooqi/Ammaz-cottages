import { useState, useEffect } from "react";
import API from "../utils/api";
import { showError, showSuccess } from "../utils/toast";

function RoomDetailsModal({ room, onClose, onBookNow }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  
  // New review state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (room && room._id) {
      fetchReviews();
    }
  }, [room]);

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const res = await API.get(`/reviews/room/${room._id}`);
      setReviews(res.data.data?.reviews || []);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmitReview = async (e) => {
    if (e) e.preventDefault();

    try {
      setSubmittingReview(true);
      await API.post("/reviews", {
        room: room._id,
        rating,
        comment
      });
      showSuccess("Review submitted successfully");
      setComment("");
      setRating(5);
      fetchReviews();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!room) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-overlay-in" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden relative animate-modal-in border border-slate-200/80 dark:border-slate-800 flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 z-30 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md flex items-center justify-center transition-colors text-sm font-bold shadow-lg"
        >
          ✕
        </button>

        {/* Modal Scroll Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left Column: Room Details & Amenities */}
          <div className="lg:w-3/5 overflow-y-auto custom-scrollbar border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800">
            
            {/* Header Image Showcase */}
            <div className="relative h-72 sm:h-80 bg-slate-800 overflow-hidden group">
              {room.images && room.images.length > 0 ? (
                <>
                  <img
                    src={room.images[currentImageIndex]}
                    alt={`${room.name} ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover transition-all"
                  />
                  {room.images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((p) => (p - 1 + room.images.length) % room.images.length); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/60 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-xs backdrop-blur-md"
                      >
                        ‹
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((p) => (p + 1) % room.images.length); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900/60 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-xs backdrop-blur-md"
                      >
                        ›
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">🏨</div>
              )}

              <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-black text-white capitalize border border-white/20">
                {room.status || "Available"}
              </div>
            </div>

            {/* Room Content */}
            <div className="p-6 sm:p-8 space-y-6">
              
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{room.name}</h2>
                  <div className="text-right">
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      PKR {Number(room.pricePerNight).toLocaleString()}
                    </span>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">per night</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full border border-indigo-200/50">
                    {room.type || "Resort Room"}
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full border border-slate-200/60 dark:border-slate-700/60">
                    👥 Up to {room.capacity || 2} Guests
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider mb-2">About this room</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                  {room.description || "Luxurious resort accommodation equipped with premium bedding and guest amenities."}
                </p>
              </div>

              {/* What this place offers (Airbnb Style Icon Grid) */}
              {room.facilities && room.facilities.length > 0 && (
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider mb-3">What this place offers</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {room.facilities.map((fac, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{fac}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Right Column: Guest Reviews Scorecard */}
          <div className="lg:w-2/5 flex flex-col bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden">
            
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                Guest Reviews
                <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  {reviews.length}
                </span>
              </h3>
              <div className="text-xs font-black text-amber-500 flex items-center gap-1">
                <span>⭐</span>
                <span>{room.averageRating ? Number(room.averageRating).toFixed(1) : "New"}</span>
              </div>
            </div>

            {/* Review List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {loadingReviews ? (
                <div className="flex justify-center items-center h-20">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center text-slate-400 py-10 text-xs font-bold">
                  💬 No reviews yet for this room.
                </div>
              ) : (
                reviews.map((rev) => (
                  <div key={rev._id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200/60 dark:border-slate-800 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-900 dark:text-white">{rev.user?.name || "Verified Guest"}</span>
                      <span className="text-amber-500 font-bold">⭐ {rev.rating}/5</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{rev.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Post Review Box */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300">Leave a Review:</span>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl p-1.5 focus:outline-none"
                >
                  {[5, 4, 3, 2, 1].map((num) => (
                    <option key={num} value={num}>{num} Stars ⭐</option>
                  ))}
                </select>
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your stay experience..."
                rows="2"
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none placeholder-slate-400 font-medium"
              ></textarea>

              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition disabled:opacity-50"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>

          </div>

        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Close
          </button>
          <button
            onClick={() => onBookNow(room)}
            disabled={room.status !== 'available'}
            className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition transform active:scale-95 disabled:opacity-50"
          >
            Reserve Now
          </button>
        </div>

      </div>
    </div>
  );
}

export default RoomDetailsModal;


