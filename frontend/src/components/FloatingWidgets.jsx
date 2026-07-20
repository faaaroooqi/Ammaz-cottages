import { useLocation } from "react-router-dom";

function FloatingWidgets() {
  const location = useLocation();
  const hiddenPaths = ["/admin", "/login", "/signup", "/reset-password"];
  const isHidden = hiddenPaths.some((p) => location.pathname.startsWith(p));

  if (isHidden) return null;

  const whatsappNumber = "923488962092";
  const mapsUrl = "https://www.google.com/maps/dir//Ammaz+Cottage,+E-75,+Rawalpindi,+Pakistan/@33.6461824,73.0529792,15z/data=!4m8!4m7!1m0!1m5!1m1!1s0x38dfd931b232487f:0x29e917e2d1e1fe2f!2m2!1d73.3962381!2d33.8761628?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3.5 items-end">
      {/* WhatsApp Floating Button */}
      <a
        href={`https://wa.me/${whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Chat on WhatsApp"
        className="group relative flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 border border-white/20"
      >
        {/* Tooltip */}
        <span className="absolute right-16 scale-0 transition-all duration-200 group-hover:scale-100 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow border border-gray-800 pointer-events-none">
          Chat on WhatsApp
        </span>
        <svg
          className="w-7 h-7 fill-current"
          viewBox="0 0 24 24"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.858.002-2.634-1.019-5.112-2.875-6.97-1.857-1.859-4.331-2.88-6.967-2.881-5.439 0-9.865 4.421-9.869 9.86-.001 1.77.466 3.497 1.353 5.046l-.99 3.613 3.659-.96zm10.374-6.31c-.301-.15-1.78-.878-2.056-.978-.275-.1-.476-.15-.676.15-.2.3-.777.978-.952 1.178-.175.2-.35.225-.65.075-.3-.15-1.268-.467-2.417-1.493-.893-.797-1.496-1.783-1.671-2.083-.175-.3-.018-.462.13-.61.135-.133.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.63-.926-2.23-.244-.588-.493-.508-.676-.518-.174-.009-.374-.01-.574-.01s-.525.075-.8.375c-.275.3-1.05 1.028-1.05 2.5s1.07 2.9 1.22 3.1c.15.2 2.106 3.216 5.1 4.51.714.309 1.272.493 1.706.63.717.228 1.369.196 1.884.119.574-.085 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.127-.275-.202-.575-.352z" />
        </svg>
      </a>

      {/* Map/Location Floating Button */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="View Location on Google Maps"
        className="group relative flex items-center justify-center w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 border border-white/20"
      >
        {/* Tooltip */}
        <span className="absolute right-16 scale-0 transition-all duration-200 group-hover:scale-100 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow border border-gray-800 pointer-events-none">
          View on Google Maps
        </span>
        <svg
          className="w-7 h-7 fill-none stroke-current"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </a>
    </div>
  );
}

export default FloatingWidgets;
