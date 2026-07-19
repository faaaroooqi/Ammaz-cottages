import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTrash, getTrashCounts, restoreTrashItem, permanentDeleteTrashItem } from "../../services/admin.service";
import { showSuccess, showError, showConfirm } from "../../utils/toast";

const TYPES = [
  { key: "bookings", label: "Bookings", icon: "🧾" },
  { key: "rooms", label: "Rooms", icon: "🛏️" },
  { key: "expenses", label: "Expenses", icon: "💸" },
  { key: "notes", label: "Notes", icon: "📝" }
];

function Trash() {
  const [activeType, setActiveType] = useState("bookings");
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ bookings: 0, rooms: 0, expenses: 0, notes: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadCounts(); }, []);
  useEffect(() => { loadItems(); }, [activeType]);

  const loadCounts = async () => {
    try {
      const res = await getTrashCounts();
      setCounts(res.data.counts);
    } catch (err) { console.error(err); }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await getTrash(activeType);
      setItems(res.data.items || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleRestore = async (id) => {
    const ok = await showConfirm("Restore this item? It will appear back in its original section and be included in calculations.");
    if (ok) {
      try {
        await restoreTrashItem(activeType, id);
        showSuccess("Item restored successfully!");
        loadItems(); loadCounts();
      } catch (err) { showError(err.response?.data?.message || "Failed to restore"); }
    }
  };

  const handlePermanentDelete = async (id) => {
    const ok = await showConfirm("⚠️ Permanently delete this item? This action CANNOT be undone.");
    if (ok) {
      try {
        await permanentDeleteTrashItem(activeType, id);
        showSuccess("Item permanently deleted!");
        loadItems(); loadCounts();
      } catch (err) { showError(err.response?.data?.message || "Failed to delete"); }
    }
  };

  const renderBookingRow = (item) => (
    <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <td className="p-4 font-bold text-blue-600 dark:text-blue-400">{item.bookingId}</td>
      <td className="p-4 font-medium text-gray-900 dark:text-white">{item.room?.name || "—"}</td>
      <td className="p-4">
        <p className="font-semibold text-gray-800 dark:text-gray-200">{item.customer?.name}</p>
        <p className="text-xs text-gray-500">{item.customer?.phone}</p>
      </td>
      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
        {new Date(item.checkIn).toLocaleDateString()} — {new Date(item.checkOut).toLocaleDateString()}
      </td>
      <td className="p-4 font-bold text-gray-800 dark:text-gray-200">PKR {item.totalAmount?.toLocaleString()}</td>
      <td className="p-4">
        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
          item.status === "confirmed" ? "bg-green-100 text-green-700" :
          item.status === "cash_paid" ? "bg-blue-100 text-blue-700" :
          "bg-gray-100 text-gray-700"
        }`}>{item.status}</span>
      </td>
      <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : "—"}</td>
      <td className="p-4">{renderActions(item._id)}</td>
    </tr>
  );

  const renderRoomRow = (item) => (
    <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <td className="p-4 font-bold text-gray-900 dark:text-white">{item.name}</td>
      <td className="p-4 text-sm text-gray-700 dark:text-gray-300">{item.type}</td>
      <td className="p-4 font-bold text-gray-800 dark:text-gray-200">PKR {item.pricePerNight?.toLocaleString()}</td>
      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{item.capacity} guests</td>
      <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : "—"}</td>
      <td className="p-4">{renderActions(item._id)}</td>
    </tr>
  );

  const renderExpenseRow = (item) => (
    <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <td className="p-4 font-medium text-gray-900 dark:text-white">{item.name}</td>
      <td className="p-4 font-bold text-red-600 dark:text-red-400">PKR {item.amount?.toLocaleString()}</td>
      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{new Date(item.date).toLocaleDateString()}</td>
      <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : "—"}</td>
      <td className="p-4">{renderActions(item._id)}</td>
    </tr>
  );

  const renderNoteRow = (item) => (
    <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <td className="p-4 font-bold text-gray-900 dark:text-white">{item.title}</td>
      <td className="p-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">{item.content}</td>
      <td className="p-4">
        {item.bookingId ? (
          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full text-xs font-bold">
            {item.bookingId.bookingId || "Linked"}
          </span>
        ) : <span className="text-gray-400 text-xs">—</span>}
      </td>
      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{new Date(item.date).toLocaleDateString()}</td>
      <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : "—"}</td>
      <td className="p-4">{renderActions(item._id)}</td>
    </tr>
  );

  const renderActions = (id) => (
    <div className="flex gap-2 justify-end">
      <button onClick={() => handleRestore(id)}
        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm">
        ♻️ Restore
      </button>
      <button onClick={() => handlePermanentDelete(id)}
        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm">
        🗑️ Delete Forever
      </button>
    </div>
  );

  const HEADERS = {
    bookings: ["Booking ID", "Room", "Customer", "Dates", "Amount", "Status", "Deleted On", "Actions"],
    rooms: ["Name", "Type", "Price/Night", "Capacity", "Deleted On", "Actions"],
    expenses: ["Name", "Amount", "Date", "Deleted On", "Actions"],
    notes: ["Title", "Content", "Booking", "Date", "Deleted On", "Actions"]
  };

  const RENDERERS = {
    bookings: renderBookingRow,
    rooms: renderRoomRow,
    expenses: renderExpenseRow,
    notes: renderNoteRow
  };

  const totalTrash = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Link to="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition mb-4 font-semibold">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
      </Link>

      <div className="mb-6">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">🗑️ Trash</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">
          {totalTrash} deleted item(s) — restore or permanently remove
        </p>
      </div>

      {/* Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {TYPES.map(t => (
          <button key={t.key} onClick={() => setActiveType(t.key)}
            className={`rounded-2xl p-5 text-left transition-all transform hover:scale-105 shadow-sm border ${
              activeType === t.key
                ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-transparent shadow-lg"
                : "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-blue-400"
            }`}
          >
            <div className="text-2xl mb-1">{t.icon}</div>
            <div className="font-bold text-lg">{t.label}</div>
            <div className={`text-sm font-medium mt-1 ${activeType === t.key ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
              {counts[t.key]} item(s)
            </div>
          </button>
        ))}
      </div>

      {/* Items Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            Deleted {TYPES.find(t => t.key === activeType)?.label}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {HEADERS[activeType].map(h => (
                  <th key={h} className={`p-4 font-semibold ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={HEADERS[activeType].length} className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={HEADERS[activeType].length} className="p-8 text-center text-gray-500 dark:text-gray-400">
                  Trash is empty for this category.
                </td></tr>
              ) : (
                items.map(item => RENDERERS[activeType](item))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Trash;
