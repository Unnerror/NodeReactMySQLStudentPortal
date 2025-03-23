import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const TwoFactor = () => {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    const userId = location.state?.userId;

    const handleVerify = async (e) => {
        e.preventDefault();

        if (code.length !== 6) {
            setError("Please enter the 6-digit code.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const res = await fetch("https://localhost:3443/verify-2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, code }),
            });

            const data = await res.json();

            if (res.ok) {
                alert("✅ 2FA Verified!");
                navigate("/dashboard");
            } else {
                setError(data.error || "Verification failed.");
            }
        } catch (err) {
            console.error(err);
            setError("Server error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
            <h1 className="position-absolute top-0 start-50 translate-middle-x mt-5">Student Portal</h1>

            <div className="card p-4 shadow" style={{ width: "400px" }}>
                <h2 className="text-center">Verify Your Account</h2>
                <p className="text-center text-muted">Enter the 6-digit code sent to your email</p>

                <form onSubmit={handleVerify}>
                    <div className="mb-3">
                        <label className="form-label">Verification Code</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            className="form-control"
                            placeholder="Enter 6-digit code"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/, ""))} // Removes non-digits
                            required
                        />
                    </div>

                    {error && <p className="text-danger">{error}</p>}

                    <button
                        type="submit"
                        className="btn btn-dark w-100"
                        disabled={isSubmitting || code.length !== 6}
                    >
                        {isSubmitting ? "Verifying..." : "Submit"}
                    </button>

                    {/* Optional Resend (future): */}
                    {/* <button
                        type="button"
                        className="btn btn-link mt-2"
                        onClick={handleResendCode}
                        disabled={isSubmitting}
                    >
                        Resend Code
                    </button> */}
                </form>
            </div>
        </div>
    );
};

export default TwoFactor;
