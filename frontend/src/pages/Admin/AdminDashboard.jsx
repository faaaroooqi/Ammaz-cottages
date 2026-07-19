import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardStats, getDailyRevenue, getCustomerDetails } from "../../services/admin.service";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Bar,
  ComposedChart,
  Area
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    bookings: { total: 0, confirmed: 0, awaitingPayment: 0, cancelled: 0, completed: 0 },
    rooms: { total: 0, available: 0, occupied: 0, maintenance: 0 }
  });
  const [revenueData, setRevenueData] = useState([]);
  const [customerStats, setCustomerStats] = useState({ returning: 0, oneTime: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    // Auto-refresh dashboard data every 15 seconds
    const interval = setInterval(loadDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, revenueRes, customersRes] = await Promise.all([
        getDashboardStats(),
        getDailyRevenue(),
        getCustomerDetails()
      ]);
      setStats(statsRes.data);
      
      // Format revenue & expense data for the chart
      const formattedRevenue = revenueRes.data.data.map(item => ({
        date: item.date,
        revenue: item.revenue || 0,
        expense: item.expense || 0,
        net: (item.revenue || 0) - (item.expense || 0)
      })).reverse(); // Oldest to newest
      
      setRevenueData(formattedRevenue);

      // Customer stats
      const customers = customersRes.data.customers || [];
      const returning = customers.filter(c => c.bookingsCount > 1).length;
      const oneTime = customers.filter(c => c.bookingsCount === 1).length;
      setCustomerStats({ returning, oneTime });

    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const bookingPieData = [
    { name: "Confirmed", value: stats.bookings.confirmed },
    { name: "Awaiting", value: stats.bookings.awaitingPayment },
    { name: "Completed", value: stats.bookings.completed },
    { name: "Cancelled", value: stats.bookings.cancelled }
  ].filter(item => item.value > 0);

  const roomPieData = [
    { name: "Available", value: stats.rooms.available },
    { name: "Occupied", value: stats.rooms.occupied },
    { name: "Maintenance", value: stats.rooms.maintenance }
  ].filter(item => item.value > 0);

  const customerPieData = [
    { name: "Returning", value: customerStats.returning },
    { name: "One-Time", value: customerStats.oneTime }
  ].filter(item => item.value > 0);

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Overview 📊</h1>
        <button onClick={loadDashboardData} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition">
          🔄 Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div 
          onClick={() => navigate("/admin/reports")}
          className="bg-white dark:bg-gray-900 shadow-sm rounded-xl p-5 border border-gray-100 dark:border-gray-800 flex flex-col justify-between hover:shadow-md transition cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transform hover:-translate-y-1"
        >
          <h3 className="text-gray-500 dark:text-gray-400 font-medium">Net Revenue (Last 30 Days)</h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
            PKR {revenueData.reduce((sum, item) => sum + item.net, 0).toLocaleString()}
          </p>
        </div>
        <div 
          onClick={() => navigate("/admin/bookings")}
          className="bg-white dark:bg-gray-900 shadow-sm rounded-xl p-5 border border-gray-100 dark:border-gray-800 flex flex-col justify-between hover:shadow-md transition cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transform hover:-translate-y-1"
        >
          <h3 className="text-gray-500 dark:text-gray-400 font-medium">Active Bookings</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {stats.bookings.confirmed + stats.bookings.awaitingPayment}
          </p>
        </div>
        <div 
          onClick={() => navigate("/admin/rooms")}
          className="bg-white dark:bg-gray-900 shadow-sm rounded-xl p-5 border border-gray-100 dark:border-gray-800 flex flex-col justify-between hover:shadow-md transition cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transform hover:-translate-y-1"
        >
          <h3 className="text-gray-500 dark:text-gray-400 font-medium">Available Rooms</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
            {stats.rooms.available} <span className="text-lg text-gray-400 dark:text-gray-500 font-normal">/ {stats.rooms.total}</span>
          </p>
        </div>
        <div 
          onClick={() => navigate("/admin/customers")}
          className="bg-white dark:bg-gray-900 shadow-sm rounded-xl p-5 border border-gray-100 dark:border-gray-800 flex flex-col justify-between hover:shadow-md transition cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transform hover:-translate-y-1"
        >
          <h3 className="text-gray-500 dark:text-gray-400 font-medium">Total Customers</h3>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            {stats.bookings.total} <span className="text-sm font-normal text-gray-400 dark:text-gray-500 block mt-1">(Total Historical)</span>
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Financial Overview Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white text-center">Daily Financial Overview</h3>
            <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-blue-500"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Revenue</span>
              <span className="flex items-center gap-1.5 text-red-500"><span className="w-3 h-3 bg-red-500 rounded-sm"></span> Expenses</span>
              <span className="flex items-center gap-1.5 text-green-500"><span className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></span> Net</span>
            </div>
          </div>
          <div className="h-80 w-full">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                  <Line type="monotone" dataKey="net" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">No financial data available yet.</div>
            )}
          </div>
        </div>

        {/* Pie Charts Grid */}
        <div className="lg:col-span-2 grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-900 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-800 flex flex-col items-center">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Booking Status</h3>
            <div className="h-64 w-full">
              {bookingPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={bookingPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {bookingPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                 <div className="h-full flex items-center justify-center text-gray-400 text-sm">No bookings.</div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-800 flex flex-col items-center">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Room Status</h3>
            <div className="h-64 w-full">
               {roomPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={roomPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                 <div className="h-full flex items-center justify-center text-gray-400 text-sm">No rooms.</div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-800 flex flex-col items-center">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Customer Loyalty</h3>
            <div className="h-64 w-full">
               {customerPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={customerPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      <Cell fill="#6366f1" /> {/* Returning - Indigo */}
                      <Cell fill="#cbd5e1" /> {/* One-Time - Slate */}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                 <div className="h-full flex items-center justify-center text-gray-400 text-sm">No customer data.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;