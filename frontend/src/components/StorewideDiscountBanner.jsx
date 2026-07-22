import { useEffect, useState } from "react";
import { getPublicDiscounts } from "../services/admin.service";

export default function StorewideDiscountBanner() {
  const [discounts, setDiscounts] = useState(null);

  useEffect(() => {
    getPublicDiscounts()
      .then((res) => setDiscounts(res.data))
      .catch(() => {});
  }, []);

  if (!discounts) return null;

  const { stayDiscounts, dateDiscounts } = discounts;
  const { sevenDays, fifteenDays, thirtyDays } = stayDiscounts || {};

  const hasStayDiscounts =
    (sevenDays?.enabled && sevenDays.percentage > 0) ||
    (fifteenDays?.enabled && fifteenDays.percentage > 0) ||
    (thirtyDays?.enabled && thirtyDays.percentage > 0);

  const hasDateDiscounts = dateDiscounts && dateDiscounts.length > 0;

  if (!hasStayDiscounts && !hasDateDiscounts) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl p-4 md:p-6 shadow-lg mb-8 relative overflow-hidden">
      <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 text-9xl pointer-events-none select-none">
        🏷️
      </div>

      <div className="relative z-10 space-y-3">
        <div className="flex items-center gap-2">
          <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
            🎉 Active Deals & Savings
          </span>
        </div>

        {hasStayDiscounts && (
          <div>
            <h3 className="text-lg md:text-xl font-black">
              Book More & Save Big with Long-Stay Discounts!
            </h3>
            <div className="flex flex-wrap gap-2.5 mt-2">
              {sevenDays?.enabled && sevenDays.percentage > 0 && (
                <span className="bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5">
                  <span>✨ 7+ Nights:</span>
                  <span className="text-yellow-300 font-extrabold">{sevenDays.percentage}% OFF</span>
                </span>
              )}
              {fifteenDays?.enabled && fifteenDays.percentage > 0 && (
                <span className="bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5">
                  <span>🔥 15+ Nights:</span>
                  <span className="text-yellow-300 font-extrabold">{fifteenDays.percentage}% OFF</span>
                </span>
              )}
              {thirtyDays?.enabled && thirtyDays.percentage > 0 && (
                <span className="bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5">
                  <span>👑 30+ Nights:</span>
                  <span className="text-yellow-300 font-extrabold">{thirtyDays.percentage}% OFF</span>
                </span>
              )}
            </div>
          </div>
        )}

        {hasDateDiscounts && (
          <div className="pt-2 border-t border-white/15">
            <p className="text-xs md:text-sm font-semibold text-purple-100 mb-1.5">
              ⚡ Special Date Sales Available:
            </p>
            <div className="flex flex-wrap gap-2">
              {dateDiscounts.map((d) => (
                <div
                  key={d._id || d.date}
                  className="bg-black/25 backdrop-blur-sm border border-white/25 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2"
                >
                  <span className="text-yellow-300 font-mono font-extrabold">{d.date}</span>
                  <span>— {d.title || "Date Sale"}:</span>
                  <span className="bg-yellow-400 text-gray-900 px-1.5 py-0.5 rounded text-[11px] font-black">
                    {d.discountPercentage}% OFF
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
