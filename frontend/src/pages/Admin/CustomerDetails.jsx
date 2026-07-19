import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCustomerDetails, applyCustomerDiscount } from "../../services/admin.service";
import { showSuccess, showError } from "../../utils/toast";

/* ─── Inline Discount Editor ──────────────────────────────────────── */
function DiscountEditor({ customer, onSave }) {
  const current = customer.discountPercentage || 0;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(current));
  const [saving, setSaving] = useState(false);

  const openEditor = () => {
    setValue(String(current));
    setEditing(true);
  };

  const handleSave = async () => {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      showError("Please enter a valid percentage between 0 and 100.");
      return;
    }
    const rounded = Math.round(parsed * 10) / 10; // one decimal max
    if (rounded === current) { setEditing(false); return; }

    setSaving(true);
    try {
      await onSave(customer._id, rounded);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => setEditing(false);

  const handleRemove = async () => {
    if (current === 0) return;
    setSaving(true);
    try {
      await onSave(customer._id, 0);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 justify-center">
        <div className="relative">
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
            autoFocus
            className="w-24 border-2 border-indigo-400 rounded-lg px-3 py-1.5 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white dark:bg-gray-800 dark:text-white dark:border-indigo-500"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">%</span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
        >
          {saving ? "..." : "✓"}
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-lg transition"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 justify-center">
      {current > 0 ? (
        <>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            {current}% OFF
          </span>
          <button
            onClick={openEditor}
            title="Edit discount"
            className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-500 hover:text-indigo-700 transition"
          >
            ✏️
          </button>
          <button
            onClick={handleRemove}
            disabled={saving}
            title="Remove discount"
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition disabled:opacity-50"
          >
            {saving ? "⏳" : "🚫"}
          </button>
        </>
      ) : (
        <button
          onClick={openEditor}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-dashed border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition"
        >
          + Add Discount
        </button>
      )}
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────── */
function CustomerDetails() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await getCustomerDetails();
      setCustomers(res.data.customers);
    } catch (err) {
      console.error(err);
      showError("Failed to fetch customer details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscountSave = async (userId, newDiscount) => {
    try {
      await applyCustomerDiscount(userId, newDiscount);
      if (newDiscount > 0) {
        showSuccess(`Discount of ${newDiscount}% applied! Customer notified by email.`);
      } else {
        showSuccess("Discount removed successfully.");
      }
      setCustomers((prev) =>
        prev.map((c) => c._id === userId ? { ...c, discountPercentage: newDiscount } : c)
      );
    } catch (err) {
      console.error(err);
      showError("Failed to update discount.");
      throw err; // re-throw so DiscountEditor's saving state resets
    }
  };

  const filtered = customers.filter((c) =>
    [c.name, c.email, c.phone].some((f) =>
      f?.toLowerCase().includes(search.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const discountedCount = customers.filter((c) => (c.discountPercentage || 0) > 0).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Link
        to="/admin"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 transition mb-4 font-semibold"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Customer Details 👥</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {customers.length} customers · {discountedCount} with active discounts
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by name, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 w-52"
          />
          <button
            onClick={fetchCustomers}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Hint Banner */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-3 text-sm text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
        <span className="mt-0.5">💡</span>
        <span>
          You can set <strong>any discount (0–100%)</strong> for any customer. Click <strong>+ Add Discount</strong> or the ✏️ icon to edit.
          Customers receive an email notification when a discount is added. Use the 🚫 button to cancel an active discount.
        </span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 shadow-sm rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Name</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Email</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-center">Bookings</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Rooms Booked</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-center min-w-[200px]">
                  Discount
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    {search ? "No customers match your search." : "No customers found."}
                  </td>
                </tr>
              ) : (
                filtered.map((customer) => (
                  <tr
                    key={customer._id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                  >
                    {/* Name */}
                    <td className="p-4 text-gray-800 dark:text-gray-200 font-medium">
                      {customer.name}
                      {customer.bookingsCount > 1 && (
                        <span className="ml-2 text-xs text-blue-500 dark:text-blue-400 font-semibold">
                          Returning
                        </span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">{customer.email}</td>

                    {/* Bookings count */}
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-sm font-bold ${
                          customer.bookingsCount > 1
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {customer.bookingsCount}
                      </span>
                    </td>

                    {/* Rooms booked */}
                    <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">
                      {customer.roomsBooked && customer.roomsBooked.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {customer.roomsBooked.map((room, idx) => (
                            <span
                              key={idx}
                              className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded text-xs border border-indigo-100 dark:border-indigo-800/30"
                            >
                              {room}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">None</span>
                      )}
                    </td>

                    {/* Discount editor */}
                    <td className="p-4">
                      <DiscountEditor customer={customer} onSave={handleDiscountSave} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CustomerDetails;
