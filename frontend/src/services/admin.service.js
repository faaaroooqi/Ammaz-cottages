import API from "../utils/api";

/* Dashboard stats */
export const getDashboardStats = () =>
  API.get("/admin/dashboard");

/* Filter bookings */
export const getBookings = (params) =>
  API.get("/admin/bookings", { params });

/* Mark booking as cash paid */
export const markCashPayment = (data) =>
  API.post("/admin/cash-payment", data);

/* Revenue report */
export const getRevenueReport = (params) =>
  API.get("/admin/reports/revenue", { params });

/* Daily revenue */
export const getDailyRevenue = () =>
  API.get("/admin/reports/daily");

/* --- Room CRUD --- */
export const createRoom = (data) => API.post("/rooms", data);
export const updateRoom = (id, data) => API.put(`/rooms/${id}`, data);
export const deleteRoom = (id) => API.delete(`/rooms/${id}`);

/* --- Booking CRUD --- */
export const createBooking = (data) => API.post("/bookings", data);
export const updateBooking = (id, data) => API.put(`/bookings/${id}`, data);
export const deleteBooking = (id) => API.delete(`/bookings/${id}`);

/* --- Image Upload (Cloudinary) --- */
export const uploadRoomImages = (formData) =>
  API.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

export const deleteCloudinaryImage = (publicId) =>
  API.delete("/upload", { data: { publicId } });

export const uploadPaymentScreenshot = (bookingId, formData) =>
  API.post(`/bookings/${bookingId}/screenshot`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

/* --- Report Export (PDF / Excel) --- */
export const exportReport = ({ startDate, endDate, format }) =>
  API.get("/admin/reports/export", {
    params: { startDate, endDate, format },
    responseType: "blob"
  });

export const exportExpensesReport = ({ startDate, endDate, format }) =>
  API.get("/admin/reports/export/expenses", {
    params: { startDate, endDate, format },
    responseType: "blob"
  });

export const exportNotesReport = ({ startDate, endDate, format }) =>
  API.get("/admin/reports/export/notes", {
    params: { startDate, endDate, format },
    responseType: "blob"
  });

/* --- Customer Details & Discounts --- */
export const getCustomerDetails = () => API.get("/admin/customers/details");
export const applyCustomerDiscount = (userId, discountPercentage) => 
  API.patch(`/admin/customers/${userId}/discount`, { discountPercentage });

/* --- Expenses --- */
export const getExpenses = (params) => API.get("/admin/expenses", { params });
export const createExpense = (data) => API.post("/admin/expenses", data);
export const updateExpense = (id, data) => API.put(`/admin/expenses/${id}`, data);
export const deleteExpense = (id) => API.delete(`/admin/expenses/${id}`);

/* --- Notes --- */
export const getNotes = (params) => API.get("/admin/notes", { params });
export const createNote = (data) => API.post("/admin/notes", data);
export const updateNote = (id, data) => API.put(`/admin/notes/${id}`, data);
export const deleteNote = (id) => API.delete(`/admin/notes/${id}`);

/* --- Trash --- */
export const getTrashCounts = () => API.get("/admin/trash/counts");
export const getTrash = (type) => API.get(`/admin/trash/${type}`);
export const restoreTrashItem = (type, id) => API.patch(`/admin/trash/${type}/${id}/restore`);
export const permanentDeleteTrashItem = (type, id) => API.delete(`/admin/trash/${type}/${id}`);

/* --- Password Reset Requests --- */
export const getPasswordResetRequests = () => 
  API.get("/admin/password-resets");

export const approvePasswordReset = (requestId) => 
  API.post(`/admin/password-resets/${requestId}/approve`);

/* --- Manual Discount Notifications --- */
export const sendDiscountEmail = (userId) => 
  API.post(`/admin/customers/${userId}/send-discount-email`);

/* --- Polling Alerts --- */
export const getAdminAlerts = (since) => 
  API.get("/admin/alerts", { params: { since } });

/* --- Payment Options (Admin CRUD) --- */
export const getAdminPaymentOptions = () =>
  API.get("/admin/payment-options");

export const createPaymentOption = (data) =>
  API.post("/admin/payment-options", data);

export const updatePaymentOption = (id, data) =>
  API.put(`/admin/payment-options/${id}`, data);

export const deletePaymentOption = (id) =>
  API.delete(`/admin/payment-options/${id}`);

/* --- Email Logs / Mailbox --- */
export const getEmailLogs = (params) => API.get("/admin/emails", { params });
export const getEmailLogById = (id) => API.get(`/admin/emails/${id}`);