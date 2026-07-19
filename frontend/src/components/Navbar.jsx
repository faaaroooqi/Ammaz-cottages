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
    const handleScroll = () => setScrolled(window.scrollY > 20);
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
      className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 py-3"
          : "bg-white/95 dark:bg-gray-900/95 py-4"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Logo */}
        <Link to={user ? "/" : "/rooms"} className="flex items-center space-x-2 group">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all transform group-hover:-translate-y-0.5">
            <span className="text-white text-xl font-bold">H</span>
          </div>
          <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-indigo-800 dark:from-blue-400 dark:to-indigo-400 tracking-tight">
            Ammaz Cottages
          </span>
        </Link>

        {/* Center Navigation (Desktop) */}
        <div className="hidden md:flex items-center space-x-8">
          <Link
            to={roomsLink}
            className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${isActive(roomsLink) ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Rooms
          </Link>
          {user && (
            <Link
              to="/my-bookings"
              className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${isActive("/my-bookings") ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              My Bookings
            </Link>
          )}
        </div>

        <div className="relative flex items-center space-x-3">
          {/* Mobile hamburger */}
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Auth section */}
          {user ? (
            <div className="relative profile-dropdown">
              <div
                className="flex items-center space-x-3 cursor-pointer group"
                onClick={() => setOpen(!open)}
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-800 dark:text-white leading-none">{user.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{user.role}</p>
                </div>
                <img
                  src={user.profilePic || "https://ui-avatars.com/api/?name=" + user.username + "&background=random"}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-transparent group-hover:border-blue-500 transition-all shadow-sm object-cover"
                />
              </div>

              {/* Dropdown */}
              {open && (
                <div className="absolute right-0 mt-3 w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden transform opacity-100 scale-100 transition-all origin-top-right animate-modal-in">
                  <div className="p-2 space-y-1">
                    {["owner", "staff"].includes(user.role) && (
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-2.5 text-sm font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                        onClick={() => setOpen(false)}
                      >
                        <span className="mr-2">🛠</span> Admin Dashboard
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      className="block px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      My Profile
                    </Link>

                    <Link
                      to="/my-bookings"
                      className="block px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors md:hidden"
                      onClick={() => setOpen(false)}
                    >
                      My Bookings
                    </Link>

                    {/* Theme */}
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1 pt-1">
                      <button
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center transition-colors"
                        onClick={() => setThemeMenu(!themeMenu)}
                      >
                        <span>Theme</span>
                        <span className="text-xs text-gray-400">{theme === "dark" ? "🌙" : "🌞"}</span>
                      </button>

                      {themeMenu && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl mt-1 p-1 flex gap-1">
                          <button
                            onClick={() => { setTheme("light"); setThemeMenu(false); }}
                            className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${theme !== "dark"
                                ? "bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400"
                                : "text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                              }`}
                          >
                            Light
                          </button>
                          <button
                            onClick={() => { setTheme("dark"); setThemeMenu(false); }}
                            className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${theme === "dark"
                                ? "bg-gray-800 shadow-sm text-white"
                                : "text-gray-500 hover:bg-gray-200"
                              }`}
                          >
                            Dark
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 my-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Log out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-3">
              <Link to="/login" className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-2">
                Log in
              </Link>
              <Link to="/signup" className="text-sm font-bold bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 shadow-md hover:shadow-lg transform transition-all hover:-translate-y-0.5">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenu && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl animate-fade-in-up">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
            <Link
              to={roomsLink}
              className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors"
              onClick={() => setMobileMenu(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Rooms
            </Link>
            {user && (
              <Link
                to="/my-bookings"
                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors"
                onClick={() => setMobileMenu(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                My Bookings
              </Link>
            )}
            {!user && (
              <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                <Link
                  to="/login"
                  className="flex-1 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setMobileMenu(false)}
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="flex-1 text-center text-sm font-bold bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 shadow-md transition-all"
                  onClick={() => setMobileMenu(false)}
                >
                  Sign up
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
