import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../utils/api";
import { createRoom, updateRoom, deleteRoom } from "../../services/admin.service";
import RoomModal from "../../components/Admin/RoomModal";
import { showSuccess, showError, showConfirm } from "../../utils/toast";

function ManageRooms() {
  const [rooms, setRooms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const res = await API.get("/rooms");
      setRooms(res.data.rooms);
    } catch (err) {
      console.error("Failed to load rooms", err);
    }
  };

  const handleAddNew = () => {
    setEditingRoom(null);
    setIsModalOpen(true);
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setIsModalOpen(true);
  };

  const handleDelete = async (roomId) => {
    const ok = await showConfirm("Are you sure you want to delete this room?");
    if (ok) {
      try {
        await deleteRoom(roomId);
        showSuccess("Room deleted successfully!");
        loadRooms();
      } catch (err) {
        console.error("Error deleting room", err);
        showError("Failed to delete room");
      }
    }
  };

  const handleSaveRoom = async (roomData) => {
    try {
      if (editingRoom) {
        await updateRoom(editingRoom._id, roomData);
      } else {
        await createRoom(roomData);
      }
      setIsModalOpen(false);
      showSuccess(editingRoom ? "Room updated!" : "Room created!");
      loadRooms();
    } catch (err) {
      console.error("Error saving room", err);
      showError(err.response?.data?.message || "Failed to save room");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Link to="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition mb-4 font-semibold">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
      </Link>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Manage Rooms</h2>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow transition"
        >
          + Add New Room
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <th className="p-4 font-semibold">Room</th>
              <th className="p-4 font-semibold">Details</th>
              <th className="p-4 font-semibold">Amenities</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rooms.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">
                  No rooms found. Add a new room to get started.
                </td>
              </tr>
            ) : (
              rooms.map((room) => (
                <tr key={room._id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 flex items-center gap-4">
                    {room.images?.[0] ? (
                      <img src={room.images[0]} alt={room.name} className="w-16 h-16 object-cover rounded-lg shadow-sm" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">No Img</div>
                    )}
                    <div>
                      <div className="font-bold text-gray-900">{room.name}</div>
                      <div className="text-sm text-gray-500">{room.type}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-gray-900 font-medium">PKR {room.pricePerNight} <span className="text-sm text-gray-500 font-normal">/ night</span></div>
                    <div className="text-sm text-gray-500">Up to {room.capacity} guests</div>
                  </td>
                  <td className="p-4 max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {room.facilities?.slice(0, 3).map((f) => (
                        <span key={f} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-100">{f}</span>
                      ))}
                      {room.facilities?.length > 3 && <span className="text-xs text-gray-500">+{room.facilities.length - 3} more</span>}
                      {(!room.facilities || room.facilities.length === 0) && <span className="text-gray-400 text-sm">None</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        room.status === 'available' ? "bg-green-100 text-green-700" :
                        room.status === 'occupied' ? "bg-orange-100 text-orange-700" :
                        room.status === 'maintenance' ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {room.status || "AVAILABLE"}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center gap-3 items-center h-full pt-6">
                    <button
                      onClick={() => handleEdit(room)}
                      className="text-blue-600 hover:text-blue-800 transition"
                      title="Edit Room"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(room._id)}
                      className="text-red-500 hover:text-red-700 transition"
                      title="Delete Room"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <RoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRoom}
        roomData={editingRoom}
      />
    </div>
  );
}

export default ManageRooms;