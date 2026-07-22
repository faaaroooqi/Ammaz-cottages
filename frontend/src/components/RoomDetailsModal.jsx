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
      fetchReviews(); // Refresh reviews
    } catch (err) {
      showError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!room) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-overlay-in" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden relative animate-modal-in border border-gray-100 dark:border-gray-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 z-20 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md flex items-center justify-center text-white transition-colors text-xl shadow-lg"
        >
          &times;
        </button>

        {/* Content Area - Split Layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* LEFT COLUMN: Room Details (Scrollable independently) */}
          <div className="lg:w-3/5 overflow-y-auto custom-scrollbar border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-800">
            {/* Image Header */}
            <div className="relative h-72 sm:h-96 bg-gray-200 dark:bg-gray-800 flex-shrink-0 group">
              {room.images && room.images.length > 0 ? (
                <>
                  <img
                    src={room.images[currentImageIndex]}
                    alt={`${room.name} view ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {room.images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((p) => (p - 1 + room.images.length) % room.images.length); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70 text-lg shadow-lg"
                      >
                        ‹
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((p) => (p + 1) % room.images.length); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70 text-lg shadow-lg"
                      >
                        ›
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {room.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${
                              idx === currentImageIndex ? "bg-white w-6 shadow-md" : "bg-white/50 hover:bg-white/80"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20">
                  <span className="text-8xl">🏨</span>
                </div>
              )}
              
              {/* Status Badge */}
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold shadow-md capitalize border border-white/50">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${room.status === 'available' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {room.status}
              </div>
            </div>

            {/* Details Section */}
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{room.name}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
                    <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-md">
                      {room.type}
                    </span>
                    <span className="flex items-center text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-md">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                      Up to {room.capacity} Guests
                    </span>
                    {room.accommodations && (
                      <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-md font-semibold">
                        👤 {room.accommodations}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                    PKR {room.pricePerNight}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">per night</div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">About this room</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {room.description || "No description provided."}
                </p>
              </div>

              {room.facilities && room.facilities.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Amenities & Facilities</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
                    {room.facilities.map((f, idx) => (
                      <div key={idx} className="flex items-center text-gray-700 dark:text-gray-300">
                        <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        <span className="font-medium text-sm">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Reviews (Scrollable independently) */}
          <div className="lg:w-2/5 flex flex-col bg-gray-50 dark:bg-gray-800/30 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                User Reviews
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                  {reviews.length}
                </span>
              </h3>
            </div>

            {/* Review List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {loadingReviews ? (
                <div className="flex justify-center items-center h-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <span className="text-4xl block mb-3">💬</span>
                  No reviews yet. Be the first to leave one!
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review._id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300">
                          {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white text-sm">{review.user?.name || 'Anonymous User'}</div>
                          <div className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {review.comment}
                    </p>
                    
                    {/* Admin Reply */}
                    {review.reply && review.reply.message && (
                      <div className="mt-4 pl-4 border-l-2 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 p-3 rounded-r-lg">
                        <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1">Response from Management</div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">{review.reply.message}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add Review Form */}
            <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm text-gray-700 dark:text-gray-300">Rate your stay:</span>
                <div className="flex flex-row-reverse justify-end items-center gap-1">
                  {/* CSS star rating trick using flex-row-reverse */}
                  {[5, 4, 3, 2, 1].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`w-6 h-6 transition-colors ${rating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'}`}
                      style={{ outline: 'none' }}
                    >
                      <svg fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience (Optional)..."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none mb-3 text-gray-900 dark:text-white placeholder-gray-400"
                rows="3"
              ></textarea>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingReview ? (
                  <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> Posting...</>
                ) : "Post Review"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 dark:border-gray-800 p-4 sm:px-8 sm:py-5 bg-white dark:bg-gray-900 flex flex-col sm:flex-row gap-3 justify-end items-center shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => onBookNow(room)}
            disabled={room.status !== 'available'}
            className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {room.status === 'available' ? 'Book Now' : 'Not Available'}
          </button>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}

export default RoomDetailsModal;

