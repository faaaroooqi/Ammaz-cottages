import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../../utils/api";

function PaymentSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = params.get("bookingId");

  useEffect(() => {
    if (bookingId) {
      API.post(`/payments/verify-success`, { bookingId })
        .catch(() => {});
    }
  }, [bookingId]);

  return (
    <div className="max-w-lg mx-auto mt-16 bg-green-100 p-6 rounded shadow text-center">
      <h2 className="text-2xl font-bold text-green-700 mb-2">
        Payment Successful 🎉
      </h2>
      <p className="mb-4">
        Your booking has been confirmed successfully.
      </p>
      <button
        onClick={() => navigate("/my-bookings")}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        View My Bookings
      </button>
    </div>
  );
}

export default PaymentSuccess;
