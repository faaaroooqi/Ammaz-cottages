import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCustomerDetails,
  applyCustomerDiscount,
  getAdminDiscounts,
  updateStayDiscounts,
  addDateDiscount,
  updateDateDiscount,
  deleteDateDiscount
} from "../../services/admin.service";
import { showSuccess, showError, showConfirm } from "../../utils/toast";

/* ─── Inline Customer Discount Editor ─────────────────────────────── */
function CustomerDiscountEditor({ customer, onSave }) {
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
    const rounded = Math.round(parsed * 10) / 10;
    if (rounded === current) { setEditing(false); return; }

    setSaving(true);
    try {
      await onSave(customer._id, rounded);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

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
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
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
          onClick={() => setEditing(false)}
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

/* ─── Main Page Component ─────────────────────────────────────────── */
function CustomerDetails() {
  const [activeTab, setActiveTab] = useState("storewide"); // "customer" or "storewide"
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [search, setSearch] = useState("");

  // Storewide discount state
  const [discountConfig, setDiscountConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Form state for stay discounts
  const [stayForm, setStayForm] = useState({
    sevenDays: { enabled: true, percentage: 10 },
    fifteenDays: { enabled: true, percentage: 15 },
    thirtyDays: { enabled: true, percentage: 25 }
  });
  const [savingStay, setSavingStay] = useState(false);

  // Form state for new date discount
  const [newDateForm, setNewDateForm] = useState({
    date: "",
    discountPercentage: "",
    title: "",
    enabled: true
  });
  const [addingDate, setAddingDate] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchStorewideDiscounts();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const res = await getCustomerDetails();
      setCustomers(res.data.customers);
    } catch (err) {
      console.error(err);
      showError("Failed to fetch customer details.");
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchStorewideDiscounts = async () => {
    try {
      setLoadingConfig(true);
      const res = await getAdminDiscounts();
      const cfg = res.data.discountConfig;
      setDiscountConfig(cfg);
      if (cfg?.stayDiscounts) {
        setStayForm({
          sevenDays: {
            enabled: cfg.stayDiscounts.sevenDays?.enabled ?? true,
            percentage: cfg.stayDiscounts.sevenDays?.percentage ?? 10
          },
          fifteenDays: {
            enabled: cfg.stayDiscounts.fifteenDays?.enabled ?? true,
            percentage: cfg.stayDiscounts.fifteenDays?.percentage ?? 15
          },
          thirtyDays: {
            enabled: cfg.stayDiscounts.thirtyDays?.enabled ?? true,
            percentage: cfg.stayDiscounts.thirtyDays?.percentage ?? 25
          }
        });
      }
    } catch (err) {
      console.error(err);
      showError("Failed to load storewide discount settings.");
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleCustomerDiscountSave = async (userId, newDiscount) => {
    try {
      await applyCustomerDiscount(userId, newDiscount);
      if (newDiscount > 0) {
        showSuccess(`Discount of ${newDiscount}% applied! Customer notified by email.`);
      } else {
        showSuccess("Discount removed successfully.");
      }
      setCustomers((prev) =>
        prev.map((c) => (c._id === userId ? { ...c, discountPercentage: newDiscount } : c))
      );
    } catch (err) {
      console.error(err);
      showError("Failed to update customer discount.");
      throw err;
    }
  };

  const handleSaveStayDiscounts = async (e) => {
    e.preventDefault();
    setSavingStay(true);
    try {
      const res = await updateStayDiscounts(stayForm);
      setDiscountConfig(res.data.discountConfig);
      showSuccess("Stay duration discounts updated successfully!");
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Failed to update stay discounts.");
    } finally {
      setSavingStay(false);
    }
  };

  const handleAddDateDiscount = async (e) => {
    e.preventDefault();
    if (!newDateForm.date || !newDateForm.discountPercentage) {
      showError("Please enter date and discount percentage.");
      return;
    }
    setAddingDate(true);
    try {
      const res = await addDateDiscount(newDateForm);
      setDiscountConfig(res.data.discountConfig);
      showSuccess("Specific date discount added!");
      setNewDateForm({ date: "", discountPercentage: "", title: "", enabled: true });
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Failed to add date discount.");
    } finally {
      setAddingDate(false);
    }
  };

  const handleToggleDateDiscount = async (d) => {
    try {
      const res = await updateDateDiscount(d._id, { enabled: !d.enabled });
      setDiscountConfig(res.data.discountConfig);
      showSuccess(`Date discount ${!d.enabled ? "enabled" : "disabled"}.`);
    } catch (err) {
      console.error(err);
      showError("Failed to update date discount status.");
    }
  };

  const handleDeleteDateDiscount = async (id) => {
    const ok = await showConfirm("Delete this date discount rule?");
    if (ok) {
      try {
        const res = await deleteDateDiscount(id);
        setDiscountConfig(res.data.discountConfig);
        showSuccess("Date discount removed.");
      } catch (err) {
        console.error(err);
        showError("Failed to delete date discount.");
      }
    }
  };

  const filteredCustomers = customers.filter((c) =>
    [c.name, c.email, c.phone].some((f) =>
      f?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const discountedCount = customers.filter((c) => (c.discountPercentage || 0) > 0).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Link
        to="/admin"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 transition mb-2 font-semibold text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2">
            Discount Management 🏷️
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage storewide stay & date discounts for all guests, or grant individual customer loyalty discounts.
          </p>
        </div>
      </div>

      {/* Divided Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-2">
        <button
          onClick={() => setActiveTab("storewide")}
          className={`pb-3 px-5 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "storewide"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <span>🌐 Storewide & Stay Discounts</span>
          <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full font-extrabold">
            All Customers
          </span>
        </button>
        <button
          onClick={() => setActiveTab("customer")}
          className={`pb-3 px-5 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "customer"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <span>👥 Customer-Specific Discounts</span>
          <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full font-extrabold">
            {discountedCount} Active
          </span>
        </button>
      </div>

      {/* ─── PANEL 1: STOREWIDE & STAY DISCOUNTS (ALL CUSTOMERS) ──────────────── */}
      {activeTab === "storewide" && (
        <div className="space-y-8 animate-fadeIn">
          {loadingConfig ? (
            <div className="p-12 text-center text-gray-500">Loading storewide discounts...</div>
          ) : (
            <>
              {/* 1. Stay Duration Discounts Section */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <span>📅 Long-Stay Duration Discounts</span>
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Set automated percentage discounts for guests booking long stays (7, 15, or 30 days).
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveStayDiscounts} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 7 Days */}
                    <div className={`p-5 rounded-xl border transition ${stayForm.sevenDays.enabled ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800" : "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-extrabold text-indigo-900 dark:text-indigo-300 text-base">7+ Days Booking</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={stayForm.sevenDays.enabled}
                            onChange={(e) => setStayForm({ ...stayForm, sevenDays: { ...stayForm.sevenDays, enabled: e.target.checked } })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Applied automatically when booking is between 7 and 14 nights.</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          disabled={!stayForm.sevenDays.enabled}
                          value={stayForm.sevenDays.percentage}
                          onChange={(e) => setStayForm({ ...stayForm, sevenDays: { ...stayForm.sevenDays, percentage: Number(e.target.value) } })}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-bold bg-white dark:bg-gray-800 dark:text-white disabled:opacity-50"
                        />
                        <span className="font-bold text-gray-600 dark:text-gray-300">% OFF</span>
                      </div>
                    </div>

                    {/* 15 Days */}
                    <div className={`p-5 rounded-xl border transition ${stayForm.fifteenDays.enabled ? "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800" : "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-extrabold text-purple-900 dark:text-purple-300 text-base">15+ Days Booking</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={stayForm.fifteenDays.enabled}
                            onChange={(e) => setStayForm({ ...stayForm, fifteenDays: { ...stayForm.fifteenDays, enabled: e.target.checked } })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Applied automatically when booking is between 15 and 29 nights.</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          disabled={!stayForm.fifteenDays.enabled}
                          value={stayForm.fifteenDays.percentage}
                          onChange={(e) => setStayForm({ ...stayForm, fifteenDays: { ...stayForm.fifteenDays, percentage: Number(e.target.value) } })}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-bold bg-white dark:bg-gray-800 dark:text-white disabled:opacity-50"
                        />
                        <span className="font-bold text-gray-600 dark:text-gray-300">% OFF</span>
                      </div>
                    </div>

                    {/* 30 Days */}
                    <div className={`p-5 rounded-xl border transition ${stayForm.thirtyDays.enabled ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" : "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-extrabold text-emerald-900 dark:text-emerald-300 text-base">30+ Days Booking</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={stayForm.thirtyDays.enabled}
                            onChange={(e) => setStayForm({ ...stayForm, thirtyDays: { ...stayForm.thirtyDays, enabled: e.target.checked } })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Applied automatically when booking is 30 nights or more.</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          disabled={!stayForm.thirtyDays.enabled}
                          value={stayForm.thirtyDays.percentage}
                          onChange={(e) => setStayForm({ ...stayForm, thirtyDays: { ...stayForm.thirtyDays, percentage: Number(e.target.value) } })}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-bold bg-white dark:bg-gray-800 dark:text-white disabled:opacity-50"
                        />
                        <span className="font-bold text-gray-600 dark:text-gray-300">% OFF</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingStay}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                    >
                      {savingStay ? "Saving Settings..." : "💾 Save Duration Discounts"}
                    </button>
                  </div>
                </form>
              </div>

              {/* 2. Specific Date Discounts Section */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <span>🗓️ Specific Date Promotional Discounts</span>
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Offer special discounts for any specific date (e.g. Independence Day, holidays, flash sale dates). Any guest booking on or through these dates receives the discount.
                  </p>
                </div>

                {/* Form to add new date discount */}
                <form onSubmit={handleAddDateDiscount} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-end gap-4">
                  <div className="w-full md:w-1/4">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Select Date *</label>
                    <input
                      type="date"
                      value={newDateForm.date}
                      onChange={(e) => setNewDateForm({ ...newDateForm, date: e.target.value })}
                      required
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="w-full md:w-1/4">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Discount % *</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="e.g. 15"
                        value={newDateForm.discountPercentage}
                        onChange={(e) => setNewDateForm({ ...newDateForm, discountPercentage: e.target.value })}
                        required
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
                    </div>
                  </div>

                  <div className="w-full md:w-1/3">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Promotion Title / Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Independence Day Sale"
                      value={newDateForm.title}
                      onChange={(e) => setNewDateForm({ ...newDateForm, title: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="w-full md:w-auto">
                    <button
                      type="submit"
                      disabled={addingDate}
                      className="w-full md:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {addingDate ? "Adding..." : "➕ Add Date Discount"}
                    </button>
                  </div>
                </form>

                {/* List of active date discounts */}
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <th className="p-3">Target Date</th>
                        <th className="p-3">Event / Title</th>
                        <th className="p-3 text-center">Discount Rate</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                      {(!discountConfig?.dateDiscounts || discountConfig.dateDiscounts.length === 0) ? (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-gray-500 italic">
                            No specific date discounts added yet. Add one above!
                          </td>
                        </tr>
                      ) : (
                        discountConfig.dateDiscounts.map((d) => (
                          <tr key={d._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                            <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{d.date}</td>
                            <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{d.title || "Special Date Discount"}</td>
                            <td className="p-3 text-center">
                              <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-bold text-xs">
                                {d.discountPercentage}% OFF
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleToggleDateDiscount(d)}
                                className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase transition ${
                                  d.enabled ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                                }`}
                              >
                                {d.enabled ? "Active" : "Disabled"}
                              </button>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleDeleteDateDiscount(d._id)}
                                className="text-red-500 hover:text-red-700 p-1 font-bold text-xs transition"
                                title="Delete"
                              >
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── PANEL 2: CUSTOMER-SPECIFIC EXPLICIT DISCOUNTS ───────────────────── */}
      {activeTab === "customer" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Hint Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <span className="mt-0.5">💡</span>
            <span>
              Assign custom, individual loyalty discounts (0–100%) to specific customers. The customer receives an email notification when a custom discount is applied.
            </span>
          </div>

          {/* Search bar */}
          <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <input
              type="text"
              placeholder="Search customers by name, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 w-72"
            />
            <button
              onClick={fetchCustomers}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition"
            >
              🔄 Refresh List
            </button>
          </div>

          {/* Customer Table */}
          <div className="bg-white dark:bg-gray-900 shadow-sm rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4 text-center">Total Bookings</th>
                    <th className="p-4">Rooms Booked</th>
                    <th className="p-4 text-center min-w-[200px]">Loyalty Discount</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingCustomers ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">Loading customers...</td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">
                        {search ? "No customers match your search." : "No customers found."}
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr
                        key={customer._id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                      >
                        <td className="p-4 text-gray-800 dark:text-gray-200 font-medium">
                          {customer.name}
                          {customer.bookingsCount > 1 && (
                            <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
                              Frequent Guest
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">{customer.email}</td>
                        <td className="p-4 text-center font-bold text-gray-700 dark:text-gray-300">
                          {customer.bookingsCount}
                        </td>
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
                        <td className="p-4">
                          <CustomerDiscountEditor customer={customer} onSave={handleCustomerDiscountSave} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerDetails;
