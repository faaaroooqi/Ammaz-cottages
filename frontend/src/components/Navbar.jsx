import { Link, useNavigate, useLocation } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";

function Navbar() {
  const { user, logout, theme, setTheme } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [themeMenu, setThemeMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest(".profile-dropdown")) {
        setOpen(false);
        setThemeMenu(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const isActive = (path) => location.pathname === path;
  const roomsLink = user ? "/" : "/rooms";

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl shadow-md border-b border-slate-200/60 dark:border-slate-800/60 py-3"
          : "bg-white/95 dark:bg-slate-900/95 border-b border-slate-100 dark:border-slate-800/40 py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        
        {/* Brand Logo */}
        <Link to={roomsLink} className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:shadow-lg group-hover:shadow-indigo-500/30 transition-all transform group-hover:scale-105">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 dark:from-white dark:via-blue-200 dark:to-indigo-300">
              Ammaz Cottages
            </span>
            <span className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest -mt-0.5">
              Guest House & Resort
            </span>
          </div>
        </Link>

        {/* Center Search Pill Widget (Airbnb Style) */}
        <div className="hidden lg:flex items-center">
          <div 
            onClick={() => navigate(roomsLink)}
            className="flex items-center gap-3 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/70 rounded-full px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-extrabold">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Any Room
            </span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-slate-600 dark:text-slate-300">Anytime</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-slate-400 dark:text-slate-500 font-medium">Add Guests</span>
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm ml-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Navigation & Auth */}
        <div className="flex items-center space-x-4">
          
          {/* Main Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to={roomsLink}
              className={`text-sm font-extrabold transition-all flex items-center gap-1.5 ${
                isActive(roomsLink) || isActive("/rooms")
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              }`}
            >
              Explore Rooms
            </Link>
            {user && (
              <Link
                to="/my-bookings"
                className={`text-sm font-extrabold transition-all flex items-center gap-1.5 ${
                  isActive("/my-bookings")
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                }`}
              >
                My Bookings
              </Link>
            )}
          </div>

          {/* Theme Quick Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors shadow-inner text-sm"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "🌞" : "🌙"}
          </button>

          {/* User Auth Section */}
          {user ? (
            <div className="relative profile-dropdown">
              <div
                className="flex items-center space-x-3 cursor-pointer group bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 pl-3 rounded-full border border-slate-200/80 dark:border-slate-700/80 transition-all shadow-sm"
                onClick={() => setOpen(!open)}
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-slate-900 dark:text-white leading-none">
                    {user.username || user.name}
                  </p>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mt-0.5">
                    {user.role || "Guest"}
                  </p>
                </div>
                <img
                  src={
                    user.profilePic ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.username || user.name || "User"
                    )}&background=4f46e5&color=fff&bold=true`
                  }
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-indigo-500/80 group-hover:border-indigo-400 transition-all shadow-sm object-cover"
                />
              </div>

              {/* Profile Dropdown Menu */}
              {open && (
                <div className="absolute right-0 mt-3 w-60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden transform opacity-100 scale-100 transition-all origin-top-right animate-modal-in">
                  
                  {/* User Banner in Dropdown */}
                  <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
                    <p className="text-sm font-black truncate">{user.username || user.name}</p>
                    <p className="text-xs text-indigo-200/80 truncate font-medium">{user.email}</p>
                  </div>

                  <div className="p-2 space-y-1">
                    {["owner", "staff"].includes(user.role) && (
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-2.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                        onClick={() => setOpen(false)}
                      >
                        <span className="mr-2">🛠️</span> Admin Dashboard
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <span className="mr-2.5">👤</span> My Profile & Settings
                    </Link>

                    <Link
                      to="/my-bookings"
                      className="flex items-center px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <span className="mr-2.5">🧳</span> My Reservations
                    </Link>

                    <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <span className="mr-2.5">🚪</span> Log Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-3">
              <Link
                to="/login"
                className="text-xs font-extrabold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-4 py-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="text-xs font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-full shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transform transition-all hover:-translate-y-0.5"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenu && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl animate-fade-in-up">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
            <Link
              to={roomsLink}
              className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
              onClick={() => setMobileMenu(false)}
            >
              🏢 Explore Rooms
            </Link>
            {user && (
              <Link
                to="/my-bookings"
                className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
                onClick={() => setMobileMenu(false)}
              >
                🧳 My Bookings
              </Link>
            )}
            {!user && (
              <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                <Link
                  to="/login"
                  className="flex-1 text-center text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => setMobileMenu(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="flex-1 text-center text-xs font-bold bg-indigo-600 text-white px-4 py-3 rounded-2xl hover:bg-indigo-700 shadow-md transition-all"
                  onClick={() => setMobileMenu(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;

