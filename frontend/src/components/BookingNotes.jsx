import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";

function BookingNotes({
  bookingId,
  notes = [],
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}) {
  const { user } = useContext(AuthContext);

  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editText, setEditText] = useState("");

  const isAdmin = user?.role === "admin";

  /* Add note */
  const handleAdd = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(bookingId, newNote);
    setNewNote("");
  };

  /* Update note */
  const handleUpdate = (noteId) => {
    if (!editText.trim()) return;
    onUpdateNote(bookingId, noteId, editText);
    setEditingNoteId(null);
    setEditText("");
  };

  /* Delete note */
  const handleDelete = (noteId) => {
    onDeleteNote(bookingId, noteId);
  };

  /* Highlight latest admin note */
  const latestAdminNote = notes
    .filter((n) => n.createdBy?.role === "admin")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  return (
    <div className="mt-6 space-y-3">
      {/* ⭐ Latest Admin Note */}
      {latestAdminNote && (
        <div className="p-3 border rounded bg-blue-50">
          <p className="font-semibold text-blue-700">
            Admin Note
          </p>
          <p className="mt-1">{latestAdminNote.text}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(latestAdminNote.createdAt).toLocaleString()}
          </p>
        </div>
      )}

      {/* All Notes */}
      {notes.map((note) => (
        <div
          key={note._id}
          className="flex justify-between border rounded p-2"
        >
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {note.createdBy?.role === "admin"
                ? "Admin"
                : "Guest"}
            </p>

            {editingNoteId === note._id ? (
              <>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full border rounded p-1 text-black"
                />
                <div className="flex space-x-2 mt-1">
                  <button
                    onClick={() => handleUpdate(note._id)}
                    className="bg-green-600 text-white px-2 py-1 rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingNoteId(null)}
                    className="bg-gray-500 text-white px-2 py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <p>{note.text}</p>
            )}

            <p className="text-xs text-gray-500 mt-1">
              {new Date(note.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Edit / Delete (Owner or Admin) */}
          {(isAdmin || note.createdBy?._id === user?.id) &&
            editingNoteId !== note._id && (
              <div className="space-x-2 text-sm">
                <button
                  onClick={() => {
                    setEditingNoteId(note._id);
                    setEditText(note.text);
                  }}
                  className="text-yellow-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(note._id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            )}
        </div>
      ))}

      {/* Add Note */}
      <form onSubmit={handleAdd} className="flex space-x-2 mt-2">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={
            isAdmin
              ? "Add admin remark..."
              : "Add special request..."
          }
          className="flex-1 border rounded px-2 py-1 text-black"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          Add
        </button>
      </form>
    </div>
  );
}

export default BookingNotes;
