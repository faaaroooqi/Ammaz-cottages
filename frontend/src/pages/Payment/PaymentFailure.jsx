import { useNavigate, useSearchParams } from "react-router-dom";

function PaymentFailure() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reason = params.get("reason");

  return (
    <div className="max-w-lg mx-auto mt-16 bg-red-100 p-6 rounded shadow text-center">
      <h2 className="text-2xl font-bold text-red-700 mb-2">
        Payment Failed ❌
      </h2>
      <p className="mb-4">
        {reason || "Transaction could not be completed."}
      </p>
      <button
        onClick={() => navigate("/")}
        className="bg-red-600 text-white px-4 py-2 rounded"
      >
        Try Again
      </button>
    </div>
  );
}

export default PaymentFailure;
