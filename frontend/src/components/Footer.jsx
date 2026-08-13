import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 font-sans border-t border-slate-800/80">
      
      {/* Top Banner Feature Bar */}
      <div className="border-b border-slate-800/60 bg-slate-900/40 py-8 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">256-Bit SSL Encryption</h4>
              <p className="text-[11px] text-slate-500 font-medium">Safe & secure online checkout</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center md:justify-start gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Instant Confirmation</h4>
              <p className="text-[11px] text-slate-500 font-medium">Real-time room availability</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Verified Guest Guarantee</h4>
              <p className="text-[11px] text-slate-500 font-medium">Transparent booking policies</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-3">
            <span className="text-2xl">📞</span>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">24/7 Desk Support</h4>
              <p className="text-[11px] text-slate-500 font-medium">+92 300 1234567</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Multi-Column Links Section */}
      <div className="max-w-7xl mx-auto py-12 px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Col 1: Brand Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              A
            </span>
            <span className="text-lg font-black tracking-tight text-white">Ammaz Cottages</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Premier resort & guest house booking platform. Offering mountain view luxury suites, deluxe family cottages, and high-speed Wi-Fi stays.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <span className="bg-indigo-950/60 text-indigo-400 border border-indigo-800/60 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
              ⭐ 4.9 Superhost Rated
            </span>
          </div>
        </div>

        {/* Col 2: Navigation */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-200">Navigation</h4>
          <ul className="space-y-2 text-xs font-bold">
            <li>
              <Link to="/" className="hover:text-indigo-400 transition-colors">Explore All Stays</Link>
            </li>
            <li>
              <Link to="/my-bookings" className="hover:text-indigo-400 transition-colors">My Reservations & Trips</Link>
            </li>
            <li>
              <Link to="/profile" className="hover:text-indigo-400 transition-colors">Guest Profile Settings</Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Policies & Trust */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-200">Policies & Terms</h4>
          <ul className="space-y-2 text-xs font-medium text-slate-400">
            <li className="flex items-center gap-1.5">
              <span>📜</span> 50% Standard Cancellation Refund Policy
            </li>
            <li className="flex items-center gap-1.5">
              <span>🆔</span> Mandatory CNIC / Passport Identification
            </li>
            <li className="flex items-center gap-1.5">
              <span>💳</span> Direct Bank Transfer & JazzCash Support
            </li>
          </ul>
        </div>

        {/* Col 4: Customer Support Desk */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-200">Resort Desk</h4>
          <div className="space-y-2 text-xs font-medium text-slate-400">
            <p className="flex items-center gap-2">
              <span className="text-indigo-400">📍</span> Main Resort Road, Mountain Valley
            </p>
            <p className="flex items-center gap-2">
              <span className="text-indigo-400">✉️</span> support@ammazcottages.com
            </p>
            <p className="flex items-center gap-2">
              <span className="text-indigo-400">🕒</span> Check-in: 02:00 PM | Check-out: 12:00 PM
            </p>
          </div>
        </div>

      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-slate-900 bg-slate-950 py-6 px-6 text-center text-xs text-slate-600 font-bold">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Ammaz Cottages. All rights reserved.</p>
          <div className="flex gap-4 text-[11px] text-slate-500 font-semibold">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Guest Safety</span>
          </div>
        </div>
      </div>

    </footer>
  );
}

export default Footer;

