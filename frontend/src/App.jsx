import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from "react-router-dom"; 
import Navbar from "./components/Navbar"; 
import Footer from "./components/Footer"; 
import PrivateRoute from "./components/PrivateRoute"; 
import PublicRoute from "./components/PublicRoute"; 
import AdminRoute from "./components/AdminRoute"; 
import Login from "./pages/Auth/Login"; 
import Signup from "./pages/Auth/Signup"; 
import RoomsList from "./pages/RoomsList"; 
import PublicRoomsList from "./pages/PublicRoomsList"; 
import MyBookings from "./pages/MyBookings"; 
import Profile from "./pages/Profile"; 
import BookingPage from "./pages/BookingPage"; 
import PaymentSuccess from "./pages/Payment/PaymentSuccess"; 
import PaymentFailure from "./pages/Payment/PaymentFailure"; 
import PaymentPending from "./pages/Payment/PaymentPending"; 
import AdminDashboard from "./pages/Admin/AdminDashboard"; 
import ManageBookings from "./pages/Admin/ManageBookings"; 
import ManageRooms from "./pages/Admin/ManageRooms"; 
import Reports from "./pages/Admin/Reports"; 
import CustomerDetails from "./pages/Admin/CustomerDetails";
import PasswordResets from "./pages/Admin/PasswordResets";
import AccountSettings from "./pages/Admin/AccountSettings";
import Reviews from "./pages/Admin/Reviews";
import Trash from "./pages/Admin/Trash";
import PaymentOptions from "./pages/Admin/PaymentOptions";
import Mailbox from "./pages/Admin/Mailbox";
import AdminLayout from "./layouts/AdminLayout"; 
import ResetPassword from "./pages/Auth/ResetPassword";
import BookingVoucher from "./pages/BookingVoucher";
import { AuthProvider } from "./context/AuthContext"; 
import FloatingWidgets from "./components/FloatingWidgets";


/* Hide Navbar on admin routes */ 
function ConditionalNavbar() { 
  const location = useLocation(); 
  if (location.pathname.startsWith("/admin")) { return null; } 
  return <Navbar />; 
} 

/* Hide Footer on admin, auth, and reset pages */
function ConditionalFooter() {
  const location = useLocation();
  const hidden = ["/admin", "/login", "/signup", "/reset-password"];
  if (hidden.some((p) => location.pathname.startsWith(p))) { return null; }
  return <Footer />;
}

function App() { 
  return ( 
    <AuthProvider> 
      <Router> 
        <ConditionalNavbar /> 
        <Routes> 
          {/* -- public pages (accessible without login) -------------------- */} 
          <Route element={<PublicRoute />}> 
            <Route path="/login" element={<Login />} /> 
            <Route path="/signup" element={<Signup />} /> 
            <Route path="/reset-password/:token" element={<ResetPassword />} /> 
          </Route> 

          {/* -- public rooms (viewable by everyone, even logged-out) ------- */}
          <Route path="/rooms" element={<PublicRoomsList />} />
          
          {/* -- authenticated customer routes ------------------------------ */} 
          <Route element={<PrivateRoute />}> 
            {/* customer pages */} 
            <Route path="/" element={<RoomsList />} /> 
            <Route path="/rooms/:id/book" element={<BookingPage />} /> 
            <Route path="my-bookings" element={<MyBookings />} /> 
            <Route path="profile" element={<Profile />} /> 
            <Route path="voucher/:bookingId" element={<BookingVoucher />} />
            <Route path="payment"> 
              <Route path="success" element={<PaymentSuccess />} /> 
              <Route path="failure" element={<PaymentFailure />} /> 
              <Route path="pending" element={<PaymentPending />} /> 
            </Route> 
          </Route> 
          
          {/* -- admin section (everything under /admin) --------------------- */} 
          <Route path="/admin" element={ <AdminRoute> <AdminLayout /> </AdminRoute> } > 
            <Route index element={<AdminDashboard />} /> 
            <Route path="bookings" element={<ManageBookings />} /> 
            <Route path="rooms" element={<ManageRooms />} /> 
            <Route path="reports" element={<Reports />} /> 
            <Route path="customers" element={<CustomerDetails />} />
            <Route path="password-resets" element={<PasswordResets />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="trash" element={<Trash />} />
            <Route path="payment-options" element={<PaymentOptions />} />
            <Route path="settings" element={<AccountSettings />} />
            <Route path="mailbox" element={<Mailbox />} />
          </Route> 
          
          {/* catch-all */} 
          <Route path="*" element={<Login />} /> 
        </Routes> 
        <ConditionalFooter />
        <FloatingWidgets />
      </Router> 
    </AuthProvider> 
  ); 
} 

export default App;