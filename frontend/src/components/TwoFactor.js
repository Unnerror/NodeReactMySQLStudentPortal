import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const TwoFactor = () => {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resendTimer, setResendTimer] = useState(60); // 60 second timer
    const navigate = useNavigate();
    const location = useLocation();

    const userId = location.state?.userId;

    // ⏱️ Countdown Timer Effect
    useEffect(() => {
        let timer;
        if (resendTimer > 0) {
            timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendTimer]);

    // ✅ Verify Code Handler
    const handleVerify = async (e) => {
        e.preventDefault();

        if (code.length !== 6) {
            setError("Please enter the 6-digit code.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/verify-2fa`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, code }),
                credentials: "include" // 👈 this is mandatory for sessions to work!
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

    // ✅ Resend Code Handler
    const handleResendCode = async () => {
        setIsSubmitting(true);
        setError("");
        setMessage("");

        try {
            const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/resend-2fa`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }), // ✅ sending only userId!
                credentials: "include" // 👈 this is mandatory for sessions to work!
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("A new code has been sent to your email.");
            } else {
                setError(data.error || "Resend failed. Try again.");
            }
        } catch (err) {
            console.error(err);
            setError("Server error.");
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
            <h1 className="position-absolute top-0 start-50 translate-middle-x mt-5">Student Portal</h1>

            <div className="card p-4 shadow" style={{ width: "400px" }}>
                <h2 className="text-left">Verify Your Account</h2>
                <p className="text-left text-muted">Enter the 6-digit code sent to your email</p>

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
                            onChange={(e) => setCode(e.target.value.replace(/\D/, ""))}
                            required
                        />
                    </div>

                    {error && <p className="text-danger">{error}</p>}

                    <button
                        type="submit"
                        className="btn btn-success w-100"
                        disabled={isSubmitting || code.length !== 6}
                    >
                        {isSubmitting ? "Verifying..." : "Submit"}
                    </button>

                    {/* ⏱️ Resend Code */}
                    <div className="text-center mt-3">
                        {resendTimer > 0 ? (
                            <p className="text-muted">Resend code in {resendTimer}s</p>
                        ) : (
                            <button
                                type="button"
                                className="btn link-secondary link-underline-opacity-25 link-underline-opacity-100-hover"
                                onClick={handleResendCode}
                                disabled={isSubmitting}
                            >
                                Resend Code
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TwoFactor;
