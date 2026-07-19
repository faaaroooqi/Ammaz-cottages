import { useState } from "react";
import AdminSidebar from "../components/Admin/AdminSidebar";
import { Outlet } from "react-router-dom";
import useBookingAlerts from "../hooks/useBookingAlerts";

function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 🔔 Global admin notifications — runs on ALL admin pages
  useBookingAlerts(15000);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-950 relative">
      {/* Sidebar Overlay for Hideable behavior */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        {/* Top Navbar with Hamburger */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 mr-4 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Open Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white hidden sm:block">Admin Portal</h2>
        </div>
        
        {/* Outlet Content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;