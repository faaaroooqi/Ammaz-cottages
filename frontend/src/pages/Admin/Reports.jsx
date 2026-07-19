import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { getRevenueReport, getBookings, exportReport, getExpenses, createExpense, updateExpense, deleteExpense, getNotes, createNote, updateNote, deleteNote, exportExpensesReport, exportNotesReport } from "../../services/admin.service";
import { showSuccess, showError } from "../../utils/toast";
import ExpenseModal from "../../components/Admin/ExpenseModal";
import NoteModal from "../../components/Admin/NoteModal";

function Reports() {
  const transactionsRef = useRef(null);
  const expensesRef = useRef(null);
  const notesRef = useRef(null);

  const [report, setReport] = useState({ totalRevenue: 0, totalExpenses: 0, transactions: 0 });
  const [bookings, setBookings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [notes, setNotes] = useState([]);
  const [timeRange, setTimeRange] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState("");

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  useEffect(() => { loadData(); }, []);

  const getDateRange = (range) => {
    const now = new Date();
    let start, end;
    switch(range) {
      case "hourly":
        start = new Date(now.getTime() - 60 * 60 * 1000); end = now; break;
      case "daily":
        start = new Date(new Date(now).setHours(0,0,0,0));
        end = new Date(new Date(now).setHours(23,59,59,999)); break;
      case "monthly":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59,999); break;
      case "yearly":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23,59,59,999); break;
      default:
        start = new Date(2000, 0, 1);
        end = new Date(new Date(now).setHours(23,59,59,999));
    }
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(timeRange);
      const [revenueRes, bookingsRes, expensesRes, notesRes] = await Promise.all([
        getRevenueReport({ startDate, endDate }),
        getBookings({ startDate, endDate }),
        getExpenses({ startDate, endDate }),
        getNotes({ startDate, endDate })
      ]);
      setReport(revenueRes.data.report);
      setBookings(bookingsRes.data.bookings || []);
      setExpenses(expensesRes.data.expenses || []);
      setNotes(notesRes.data.notes || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleFilter = (e) => { e.preventDefault(); loadData(); };

  const handleExport = async (type, format) => {
    const key = `${type}_${format}`;
    setExporting(key);
    try {
      const { startDate, endDate } = getDateRange(timeRange);
      let res;
      const nameMap = { revenue: "revenue_report", expenses: "expenses_report", notes: "notes_report" };
      if (type === "expenses") res = await exportExpensesReport({ startDate, endDate, format });
      else if (type === "notes") res = await exportNotesReport({ startDate, endDate, format });
      else res = await exportReport({ startDate, endDate, format });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${nameMap[type]}.${format === "pdf" ? "pdf" : "xlsx"}`;
      link.click();
      window.URL.revokeObjectURL(url);
      showSuccess(`${type} ${format.toUpperCase()} downloaded!`);
    } catch (err) { console.error(err); showError(`Failed to export`); }
    finally { setExporting(""); }
  };

  const handleSaveExpense = async (formData) => {
    try {
      if (editingExpense) { await updateExpense(editingExpense._id, formData); showSuccess("Expense updated!"); }
      else { await createExpense(formData); showSuccess("Expense added!"); }
      setIsExpenseModalOpen(false); setEditingExpense(null); loadData();
    } catch (error) { console.error(error); showError("Failed to save expense."); }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm("Delete this expense?")) {
      try { await deleteExpense(id); showSuccess("Expense deleted!"); loadData(); }
      catch (error) { console.error(error); showError("Failed to delete expense."); }
    }
  };

  const handleSaveNote = async (formData) => {
    try {
      if (editingNote) { await updateNote(editingNote._id, formData); showSuccess("Note updated!"); }
      else { await createNote(formData); showSuccess("Note added!"); }
      setIsNoteModalOpen(false); setEditingNote(null); loadData();
    } catch (error) { console.error(error); showError("Failed to save note."); }
  };

  const handleDeleteNote = async (id) => {
    if (window.confirm("Delete this note?")) {
      try { await deleteNote(id); showSuccess("Note deleted!"); loadData(); }
      catch (error) { console.error(error); showError("Failed to delete note."); }
    }
  };

  const confirmedBookings = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "cash_paid" || b.status === "completed"
  );
  const avgPerTransaction = report.transactions > 0 ? Math.round(report.totalRevenue / report.transactions) : 0;

  const ExportBtns = ({ type }) => (
    <div className="flex gap-2">
      <button onClick={() => handleExport(type, "pdf")} disabled={!!exporting}
        className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow transition disabled:opacity-50">
        {exporting === `${type}_pdf` ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div> : "📄"} PDF
      </button>
      <button onClick={() => handleExport(type, "excel")} disabled={!!exporting}
        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow transition disabled:opacity-50">
        {exporting === `${type}_excel` ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div> : "📊"} Excel
      </button>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link to="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition mb-4 font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Reports &amp; Analytics</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">View revenue, expenses, notes and export detailed reports</p>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleFilter} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Time Range</label>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-medium">
              <option value="hourly">Hourly (Last 60 mins)</option>
              <option value="daily">Daily (Today)</option>
              <option value="monthly">Monthly (This Month)</option>
              <option value="yearly">Yearly (This Year)</option>
              <option value="all_time">All Time</option>
            </select>
          </div>
          <button type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
            {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Loading...</>) : (<>🔍 Apply Filter</>)}
          </button>
        </div>
      </form>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div onClick={() => transactionsRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg cursor-pointer transform transition-transform hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <span className="text-blue-100 text-sm font-bold uppercase tracking-wider">Gross Revenue</span>
            <span className="bg-white/20 p-2 rounded-xl">💰</span>
          </div>
          <p className="text-3xl font-extrabold tracking-tight">PKR {report.totalRevenue?.toLocaleString() || 0}</p>
        </div>
        <div onClick={() => expensesRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg cursor-pointer transform transition-transform hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <span className="text-red-100 text-sm font-bold uppercase tracking-wider">Total Expenses</span>
            <span className="bg-white/20 p-2 rounded-xl">📉</span>
          </div>
          <p className="text-3xl font-extrabold tracking-tight">PKR {report.totalExpenses?.toLocaleString() || 0}</p>
        </div>
        <div onClick={() => transactionsRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg cursor-pointer transform transition-transform hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <span className="text-green-100 text-sm font-bold uppercase tracking-wider">Net Revenue</span>
            <span className="bg-white/20 p-2 rounded-xl">💸</span>
          </div>
          <p className="text-3xl font-extrabold tracking-tight">PKR {(report.totalRevenue - (report.totalExpenses || 0)).toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-purple-100 text-sm font-bold uppercase tracking-wider">Avg Transaction</span>
            <span className="bg-white/20 p-2 rounded-xl">📈</span>
          </div>
          <p className="text-3xl font-extrabold tracking-tight">PKR {avgPerTransaction.toLocaleString()}</p>
        </div>
      </div>

      {/* Full Report Export */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Export Full Report</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Download complete report with revenue, expenses &amp; notes</p>
          </div>
          <ExportBtns type="revenue" />
        </div>
      </div>

      {/* Transactions Table */}
      <div ref={transactionsRef} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Recent Transactions</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{confirmedBookings.length} confirmed booking(s) found</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="p-4 font-semibold">Booking ID</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Room</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {confirmedBookings.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500 dark:text-gray-400">No confirmed transactions in the selected date range.</td></tr>
              ) : (
                confirmedBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 font-mono text-sm font-bold text-gray-800 dark:text-gray-200">{b.bookingId}</td>
                    <td className="p-4">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">{b.customer?.name || "—"}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{b.customer?.email || ""}</div>
                    </td>
                    <td className="p-4 text-sm text-gray-700 dark:text-gray-300 font-medium">{b.room?.name || "—"}</td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-sm font-bold text-green-700 dark:text-green-400">PKR {b.totalAmount?.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        b.status === "confirmed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        b.status === "cash_paid" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                        b.status === "completed" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                        "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}>{b.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenses Table */}
      <div ref={expensesRef} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Expense Details</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Manage and track your operational costs</p>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <ExportBtns type="expenses" />
            <button onClick={() => { setEditingExpense(null); setIsExpenseModalOpen(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg> Add Expense
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Expense Name</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {expenses.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-500 dark:text-gray-400">No expenses found.</td></tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="p-4 font-medium text-gray-900 dark:text-white">{expense.name}</td>
                    <td className="p-4 text-sm font-bold text-red-600 dark:text-red-400">- PKR {expense.amount?.toLocaleString()}</td>
                    <td className="p-4 flex gap-3 justify-end">
                      <button onClick={() => { setEditingExpense(expense); setIsExpenseModalOpen(true); }}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium text-sm transition-colors">Edit</button>
                      <button onClick={() => handleDeleteExpense(expense._id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 font-medium text-sm transition-colors">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes Table */}
      <div ref={notesRef} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">📝 Admin Notes</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Track payment details, pending amounts, and booking remarks</p>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <ExportBtns type="notes" />
            <button onClick={() => { setEditingNote(null); setIsNoteModalOpen(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg> Add Note
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Title</th>
                <th className="p-4 font-semibold">Content</th>
                <th className="p-4 font-semibold">Booking</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {notes.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">No notes found. Add notes to track payment details and booking remarks.</td></tr>
              ) : (
                notes.map((note) => (
                  <tr key={note._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{new Date(note.date).toLocaleDateString()}</td>
                    <td className="p-4 font-bold text-gray-900 dark:text-white">{note.title}</td>
                    <td className="p-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">{note.content}</td>
                    <td className="p-4">
                      {note.bookingId ? (
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full text-xs font-bold">
                          {note.bookingId.bookingId || "Linked"}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4 flex gap-3 justify-end">
                      <button onClick={() => { setEditingNote(note); setIsNoteModalOpen(true); }}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium text-sm transition-colors">Edit</button>
                      <button onClick={() => handleDeleteNote(note._id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 font-medium text-sm transition-colors">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExpenseModal isOpen={isExpenseModalOpen} onClose={() => { setIsExpenseModalOpen(false); setEditingExpense(null); }} onSave={handleSaveExpense} editingExpense={editingExpense} />
      <NoteModal isOpen={isNoteModalOpen} onClose={() => { setIsNoteModalOpen(false); setEditingNote(null); }} onSave={handleSaveNote} editingNote={editingNote} bookings={bookings} />
    </div>
  );
}

export default Reports;