import { useState, useEffect } from "react";

function NoteModal({ isOpen, onClose, onSave, editingNote, bookings = [] }) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    bookingId: "",
    date: new Date().toISOString().split("T")[0]
  });

  useEffect(() => {
    if (editingNote) {
      setFormData({
        title: editingNote.title || "",
        content: editingNote.content || "",
        bookingId: editingNote.bookingId?._id || editingNote.bookingId || "",
        date: editingNote.date ? new Date(editingNote.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
      });
    } else {
      setFormData({
        title: "",
        content: "",
        bookingId: "",
        date: new Date().toISOString().split("T")[0]
      });
    }
  }, [editingNote, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      bookingId: formData.bookingId || null
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-8 relative border border-gray-100 dark:border-gray-800">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {editingNote ? "Edit Note" : "Add New Note"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="e.g. Customer payment pending"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Content</label>
            <textarea
              required
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
              placeholder="e.g. Customer paid 5000 PKR out of 10000 PKR. Remaining 5000 PKR due on checkout..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Link to Booking <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              value={formData.bookingId}
              onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              <option value="">— No booking linked —</option>
              {bookings.map(b => (
                <option key={b._id} value={b._id}>
                  {b.bookingId} — {b.customer?.name || "Unknown"} (PKR {b.totalAmount?.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold py-3.5 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5"
            >
              {editingNote ? "Update Note" : "Save Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NoteModal;
