import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../utils/api";
import { showSuccess, showError } from "../../utils/toast";

function Reviews() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null); // Review ID

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchReviews(selectedRoom);
    } else {
      setReviews([]);
    }
  }, [selectedRoom]);

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await API.get("/rooms");
      setRooms(res.data.rooms || []);
    } catch (err) {
      console.error(err);
      showError("Failed to fetch rooms.");
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchReviews = async (roomId) => {
    try {
      setLoadingReviews(true);
      // We can use the public route to get reviews for a specific room
      const res = await API.get(`/reviews/room/${roomId}`);
      setReviews(res.data.data.reviews || []);
    } catch (err) {
      console.error(err);
      showError("Failed to fetch reviews.");
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await API.delete(`/reviews/${id}`);
      showSuccess("Review deleted successfully.");
      setReviews(reviews.filter((r) => r._id !== id));
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Failed to delete review.");
    }
  };

  const handleReplySubmit = async (id) => {
    if (!replyText.trim()) {
      showError("Reply message cannot be empty.");
      return;
    }
    try {
      const res = await API.patch(`/reviews/${id}/reply`, { message: replyText });
      showSuccess("Reply posted successfully.");
      setReplyText("");
      setReplyingTo(null);
      // Update local state
      setReviews(reviews.map((r) => r._id === id ? { ...r, reply: res.data.data.review.reply } : r));
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Failed to post reply.");
    }
  };

  if (loadingRooms) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Link to="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition mb-4 font-semibold">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
      </Link>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Customer Reviews ⭐</h1>
      </div>

      {/* Room Selection */}
      <div className="bg-white dark:bg-gray-900 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-800">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select a Room to View Reviews
        </label>
        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full md:w-1/2 p-2.5"
        >
          <option value="">-- Select Room --</option>
          {rooms.map((room) => (
            <option key={room._id} value={room._id}>
              {room.name} ({room.type})
            </option>
          ))}
        </select>
      </div>

      {/* Reviews List */}
      {selectedRoom && (
        <div className="bg-white dark:bg-gray-900 shadow-sm rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Reviews Data</h2>
          
          {loadingReviews ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
          ) : reviews.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No reviews found for this room yet.
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300">
                        {review.user?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">{review.user?.name || "Anonymous User"}</div>
                        <div className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteReview(review._id)}
                        className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                        title="Delete Review"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-2 flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className={`w-5 h-5 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  {review.comment ? (
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 bg-white dark:bg-gray-900 p-3 rounded border border-gray-100 dark:border-gray-800">
                      {review.comment}
                    </p>
                  ) : (
                    <p className="text-gray-400 italic text-sm mb-4">No comment provided.</p>
                  )}

                  {/* Reply Section */}
                  {review.reply?.message ? (
                    <div className="pl-4 border-l-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded">
                      <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1">Management Reply</div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{review.reply.message}</p>
                    </div>
                  ) : (
                    <div className="mt-2">
                      {replyingTo === review._id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type your reply here..."
                            className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-sm rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                          />
                          <button
                            onClick={() => handleReplySubmit(review._id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                          >
                            Send
                          </button>
                          <button
                            onClick={() => { setReplyingTo(null); setReplyText(""); }}
                            className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingTo(review._id)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium flex items-center gap-1 transition"
                        >
                          ↪️ Reply to this review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Reviews;
