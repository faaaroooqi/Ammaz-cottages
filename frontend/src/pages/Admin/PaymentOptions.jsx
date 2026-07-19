import { useState, useEffect, useCallback } from "react";
import {
  getAdminPaymentOptions,
  createPaymentOption,
  updatePaymentOption,
  deletePaymentOption,
} from "../../services/admin.service";

/* ─── Provider presets ────────────────────────────────────────────── */
const MOBILE_WALLET_PRESETS = [
  "EasyPaisa",
  "JazzCash",
  "SadaPay",
  "NayaPay",
  "UPaisa",
  "HBL Konnect",
];

const BANK_PRESETS = [
  "Faysal Bank",
  "Meezan Bank",
  "UBL",
  "Al-Falah Bank",
  "HBL",
  "Askari Bank",
  "Allied Bank",
  "Standard Chartered",
  "Bank Alhabib",
  "Habib Metropolitan",
  "Silk Bank",
  "Summit Bank",
];

/* ─── Provider colour map ─────────────────────────────────────────── */
const PROVIDER_COLORS = {
  EasyPaisa: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", badge: "bg-green-100 text-green-700" },
  JazzCash: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", badge: "bg-red-100 text-red-700" },
  SadaPay: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-800", badge: "bg-violet-100 text-violet-700" },
  NayaPay: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", badge: "bg-orange-100 text-orange-700" },
};

const DEFAULT_WALLET_COLOR = { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-800", badge: "bg-teal-100 text-teal-700" };
const DEFAULT_BANK_COLOR = { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", badge: "bg-blue-100 text-blue-700" };

function getColor(option) {
  if (option.type === "mobile_wallet") {
    return PROVIDER_COLORS[option.provider] || DEFAULT_WALLET_COLOR;
  }
  return DEFAULT_BANK_COLOR;
}

/* ─── Empty form state ────────────────────────────────────────────── */
const EMPTY_FORM = {
  type: "mobile_wallet",
  provider: "",
  accountTitle: "",
  accountNumber: "",
  isActive: true,
  sortOrder: 0,
};

/* ─── Modal ───────────────────────────────────────────────────────── */
function OptionModal({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [customProvider, setCustomProvider] = useState(false);

  const presets = form.type === "mobile_wallet" ? MOBILE_WALLET_PRESETS : BANK_PRESETS;

  const handlePreset = (p) => {
    setForm((f) => ({ ...f, provider: p }));
    setCustomProvider(false);
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5">
          <h3 className="text-xl font-bold text-white">
            {initial?._id ? "Edit Payment Option" : "Add Payment Option"}
          </h3>
          <p className="text-indigo-200 text-sm mt-1">
            Configure a payment method for your customers
          </p>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Type Toggle */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Payment Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: "mobile_wallet", label: "📱 Mobile Wallet", desc: "EasyPaisa, JazzCash, etc." },
                { val: "bank_account", label: "🏦 Bank Account", desc: "Meezan, HBL, UBL, etc." },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => { set("type", opt.val); set("provider", ""); setCustomProvider(false); }}
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    form.type === opt.val
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">{opt.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Provider Quick-Select */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Provider
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePreset(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    form.provider === p && !customProvider
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setCustomProvider(true); set("provider", ""); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  customProvider
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                ✏️ Custom
              </button>
            </div>
            {customProvider && (
              <input
                type="text"
                value={form.provider}
                onChange={(e) => set("provider", e.target.value)}
                placeholder="Enter custom provider name"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            )}
          </div>

          {/* Account Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Account Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.accountTitle}
              onChange={(e) => set("accountTitle", e.target.value)}
              placeholder="e.g. Guest House Karachi"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {form.type === "mobile_wallet" ? "Phone Number" : "Account / IBAN"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.accountNumber}
              onChange={(e) => set("accountNumber", e.target.value)}
              placeholder={form.type === "mobile_wallet" ? "0300-1234567" : "PK36SCBL0000001123456702"}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Sort Order & Active Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Display Order
              </label>
              <input
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", parseInt(e.target.value) || 0)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Visible to Customers
              </label>
              <button
                type="button"
                onClick={() => set("isActive", !form.isActive)}
                className={`w-full py-2.5 rounded-xl border-2 text-sm font-bold transition ${
                  form.isActive
                    ? "border-green-400 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "border-gray-300 bg-gray-50 text-gray-500 dark:bg-gray-800 dark:border-gray-600"
                }`}
              >
                {form.isActive ? "✅ Active" : "⛔ Hidden"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.provider || !form.accountTitle || !form.accountNumber}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              "Save Option"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Delete Confirm ──────────────────────────────────────────────── */
function DeleteConfirm({ option, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="text-4xl mb-3">🗑️</div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Delete Payment Option?</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          <span className="font-semibold text-gray-700 dark:text-gray-300">{option.provider}</span> —{" "}
          {option.accountTitle} will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {deleting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────── */
function PaymentOptions() {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [filterType, setFilterType] = useState("all");

  const flash = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminPaymentOptions();
      setOptions(res.data.paymentOptions || []);
    } catch {
      setError("Failed to load payment options.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editTarget?._id) {
        await updatePaymentOption(editTarget._id, form);
        flash("Payment option updated successfully!");
      } else {
        await createPaymentOption(form);
        flash("Payment option added successfully!");
      }
      setShowModal(false);
      setEditTarget(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save payment option.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePaymentOption(deleteTarget._id);
      flash("Payment option deleted.");
      setDeleteTarget(null);
      load();
    } catch {
      setError("Failed to delete payment option.");
    } finally {
      setDeleting(false);
    }
  };

  const openAdd = () => { setEditTarget(null); setShowModal(true); };
  const openEdit = (opt) => { setEditTarget(opt); setShowModal(true); };

  const filtered = options.filter((o) =>
    filterType === "all" ? true : o.type === filterType
  );

  const walletCount = options.filter((o) => o.type === "mobile_wallet").length;
  const bankCount = options.filter((o) => o.type === "bank_account").length;
  const activeCount = options.filter((o) => o.isActive).length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">💳 Payment Options</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Only active options will be displayed to customers during checkout.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-lg shadow-indigo-500/20"
        >
          <span className="text-lg">+</span> Add Payment Option
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 rounded-xl px-4 py-3 flex items-center gap-3 text-sm font-medium">
          <span>✅</span> {successMsg}
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-xl px-4 py-3 flex items-center gap-3 text-sm font-medium">
          <span>⚠️</span> {error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600 font-bold">✕</button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Mobile Wallets", value: walletCount, icon: "📱", color: "text-teal-600 dark:text-teal-400" },
          { label: "Bank Accounts", value: bankCount, icon: "🏦", color: "text-blue-600 dark:text-blue-400" },
          { label: "Active (Visible)", value: activeCount, icon: "✅", color: "text-green-600 dark:text-green-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm text-center"
          >
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { val: "all", label: "All" },
          { val: "mobile_wallet", label: "📱 Mobile Wallets" },
          { val: "bank_account", label: "🏦 Bank Accounts" },
        ].map((f) => (
          <button
            key={f.val}
            onClick={() => setFilterType(f.val)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${
              filterType === f.val
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-16 text-center">
          <div className="text-5xl mb-4">💳</div>
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">No payment options yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            {filterType === "all"
              ? "Add your first payment option so customers can pay for their bookings."
              : "No options in this category. Switch filter or add a new option."}
          </p>
          {filterType === "all" && (
            <button
              onClick={openAdd}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition"
            >
              + Add First Option
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((opt) => {
            const col = getColor(opt);
            return (
              <div
                key={opt._id}
                className={`relative bg-white dark:bg-gray-900 rounded-2xl border ${col.border} dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition group`}
              >
                {/* Active badge */}
                <div className="absolute top-3 right-3">
                  {opt.isActive ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      Hidden
                    </span>
                  )}
                </div>

                {/* Type badge */}
                <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold mb-3 ${col.badge} dark:bg-opacity-20`}>
                  {opt.type === "mobile_wallet" ? "📱 Mobile Wallet" : "🏦 Bank Account"}
                </span>

                <h4 className={`font-bold text-base mb-1 ${col.text} dark:text-white`}>{opt.provider}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{opt.accountTitle}</p>
                <p className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200 break-all">
                  {opt.accountNumber}
                </p>

                {opt.sortOrder > 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">Order: {opt.sortOrder}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => openEdit(opt)}
                    className="flex-1 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(opt)}
                    className="flex-1 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <OptionModal
          initial={editTarget}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          saving={saving}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          option={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}

export default PaymentOptions;
