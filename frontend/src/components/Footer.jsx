import { useEffect, useState } from "react";
import API from "../utils/api";

function Footer() {
  const [phone, setPhone] = useState(null);
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/auth/contact")
      .then((res) => {
        setPhone(res.data.phone);
        setEmail(res.data.email);
      })
      .catch(() => {
        setPhone(null);
        setEmail(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-10 left-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top divider glow */}
      <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

      <div className="relative max-w-5xl mx-auto px-6 py-10">
        {/* Main info row */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">

          {/* Refund Policy Card */}
          <div className="group flex gap-4 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-indigo-400/40 rounded-2xl p-5 transition-all duration-300">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-xl shadow-inner">
              📋
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300 uppercase tracking-widest mb-1.5">
                Refund Policy
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Only <span className="font-bold text-white">50% of the booking amount</span> will
                be refunded if the booking was confirmed by admin and subsequently cancelled by the
                customer.
              </p>
            </div>
          </div>

          {/* Support / Contact Card */}
          <div className="group flex gap-4 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-indigo-400/40 rounded-2xl p-5 transition-all duration-300">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center text-xl shadow-inner">
              📞
            </div>
            <div>
              <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-1.5">
                Customer Support
              </h4>
              {loading ? (
                <div className="h-4 w-32 bg-white/10 rounded animate-pulse mt-1" />
              ) : (phone || email) ? (
                <div className="text-gray-300 text-sm leading-relaxed space-y-1">
                  {phone && (
                    <p>
                      For queries contact us at:{" "}
                      <a
                        href={`tel:${phone.replace(/\s/g, "")}`}
                        className="font-bold text-white hover:text-indigo-300 transition-colors underline underline-offset-2 decoration-indigo-400/50 hover:decoration-indigo-300"
                      >
                        {phone}
                      </a>
                    </p>
                  )}
                  {email && (
                    <p>
                      Or email us at:{" "}
                      <a
                        href={`mailto:${email}`}
                        className="font-bold text-white hover:text-indigo-300 transition-colors underline underline-offset-2 decoration-indigo-400/50 hover:decoration-indigo-300"
                      >
                        {email}
                      </a>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic">
                  Contact information not available.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <span>
            © {currentYear}{" "}
            <span className="text-gray-400 font-semibold">Guest House</span>. All rights reserved.
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Service online
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
