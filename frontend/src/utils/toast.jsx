import toast from "react-hot-toast";

/**
 * Themed toast helpers for the Guest House app.
 * Wraps react-hot-toast with consistent styling.
 */

export const showSuccess = (message) =>
  toast.success(message, {
    style: {
      background: "#f0fdf4",
      color: "#166534",
      border: "1px solid #bbf7d0",
      fontWeight: 600,
      fontSize: "14px",
    },
    iconTheme: { primary: "#16a34a", secondary: "#fff" },
  });

export const showError = (message) =>
  toast.error(message, {
    style: {
      background: "#fef2f2",
      color: "#991b1b",
      border: "1px solid #fecaca",
      fontWeight: 600,
      fontSize: "14px",
    },
    iconTheme: { primary: "#dc2626", secondary: "#fff" },
  });

export const showInfo = (message) =>
  toast(message, {
    icon: "ℹ️",
    style: {
      background: "#eff6ff",
      color: "#1e40af",
      border: "1px solid #bfdbfe",
      fontWeight: 600,
      fontSize: "14px",
    },
  });

/**
 * Confirmation toast that returns a Promise<boolean>.
 * Usage:
 *   const ok = await showConfirm("Delete this room?");
 *   if (ok) { ... }
 */
export const showConfirm = (message) =>
  new Promise((resolve) => {
    toast(
      (t) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: 280 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "#1f2937" }}>
            {message}
          </p>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button
              onClick={() => { toast.dismiss(t.id); resolve(false); }}
              style={{
                padding: "6px 16px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
                color: "#4b5563",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => { toast.dismiss(t.id); resolve(true); }}
              style={{
                padding: "6px 16px",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(135deg, #2563eb, #4f46e5)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        style: {
          background: "#fff",
          border: "1px solid #e5e7eb",
          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
          padding: "16px",
          borderRadius: "16px",
        },
      }
    );
  });

/**
 * Special notification toast for admin booking alerts.
 * - Clickable: navigates to /admin/bookings when clicked.
 * - Calls onDismiss() so the hook can stop the looping buzzer.
 * - Stays until manually dismissed (duration: Infinity).
 *
 * @param {object}   booking   - The booking object from the API.
 * @param {function} navigate  - React Router navigate function.
 * @param {function} onDismiss - Callback fired when the toast is dismissed.
 */
export const showBookingAlert = (booking, navigate, onDismiss) =>
  toast(
    (t) => (
      <div
        style={{ display: "flex", flexDirection: "column", gap: "4px", cursor: "pointer" }}
        onClick={() => {
          toast.dismiss(t.id);
          if (onDismiss) onDismiss();
          if (navigate) navigate("/admin/bookings");
        }}
      >
        <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#1f2937" }}>
          🔔 New Booking Request!
        </p>
        <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
          {booking.customer?.name || "Customer"} — {booking.room?.name || "Room"} — PKR{" "}
          {booking.totalAmount}
        </p>
        <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
          Click to view →
        </p>
      </div>
    ),
    {
      duration: Infinity,
      style: {
        background: "#fff",
        border: "2px solid #818cf8",
        boxShadow:
          "0 20px 25px -5px rgb(99 102 241 / 0.15), 0 8px 10px -6px rgb(99 102 241 / 0.1)",
        padding: "16px",
        borderRadius: "16px",
      },
      icon: "🔔",
    }
  );

/**
 * Special notification toast for admin password reset alerts.
 * - Clickable: navigates to /admin/password-resets when clicked.
 * - Calls onDismiss() so the hook can stop the looping buzzer.
 * - Stays until manually dismissed (duration: Infinity).
 *
 * @param {object}   request   - The password reset request object from the API.
 * @param {function} navigate  - React Router navigate function.
 * @param {function} onDismiss - Callback fired when the toast is dismissed.
 */
export const showPasswordResetAlert = (request, navigate, onDismiss) =>
  toast(
    (t) => (
      <div
        style={{ display: "flex", flexDirection: "column", gap: "4px", cursor: "pointer" }}
        onClick={() => {
          toast.dismiss(t.id);
          if (onDismiss) onDismiss();
          if (navigate) navigate("/admin/password-resets");
        }}
      >
        <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#b45309" }}>
          🔑 Password Reset Request!
        </p>
        <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
          {request.customerName || "Customer"} — {request.email}
        </p>
        <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
          Click to view →
        </p>
      </div>
    ),
    {
      duration: Infinity,
      style: {
        background: "#fff",
        border: "2px solid #f59e0b",
        boxShadow:
          "0 20px 25px -5px rgb(245 158 11 / 0.15), 0 8px 10px -6px rgb(245 158 11 / 0.1)",
        padding: "16px",
        borderRadius: "16px",
      },
      icon: "🔑",
    }
  );

/**
 * Special notification toast for admin review alerts.
 * - Clickable: navigates to /admin/reviews when clicked.
 * - Calls onDismiss() so the hook can stop the looping buzzer.
 * - Stays until manually dismissed (duration: Infinity).
 *
 * @param {object}   review    - The review object from the API.
 * @param {function} navigate  - React Router navigate function.
 * @param {function} onDismiss - Callback fired when the toast is dismissed.
 */
export const showReviewAlert = (review, navigate, onDismiss) =>
  toast(
    (t) => (
      <div
        style={{ display: "flex", flexDirection: "column", gap: "4px", cursor: "pointer" }}
        onClick={() => {
          toast.dismiss(t.id);
          if (onDismiss) onDismiss();
          if (navigate) navigate("/admin/reviews");
        }}
      >
        <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#047857" }}>
          ⭐ New Customer Review!
        </p>
        <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
          {review.user?.name || "Customer"} rated {review.room?.name || "Room"} — {review.rating} / 5
        </p>
        {review.comment && (
          <p style={{ margin: 0, fontSize: "12px", color: "#4b5563", fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "250px" }}>
            "{review.comment}"
          </p>
        )}
        <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
          Click to view →
        </p>
      </div>
    ),
    {
      duration: Infinity,
      style: {
        background: "#fff",
        border: "2px solid #10b981",
        boxShadow:
          "0 20px 25px -5px rgb(16 185 129 / 0.15), 0 8px 10px -6px rgb(16 185 129 / 0.1)",
        padding: "16px",
        borderRadius: "16px",
      },
      icon: "⭐",
    }
  );
