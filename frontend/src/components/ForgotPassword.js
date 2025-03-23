import React, { useState } from "react";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isSending, setIsSending] = useState(false); // 👈 Add loading state

    const handleForgotPassword = async (e) => {
        e.preventDefault();

        setIsSending(true); // 👈 Disable the button immediately when sending
        setError("");
        setMessage("");

        try {
            const response = await fetch("https://localhost:3443/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage("Password reset link sent! Check your email.");
                // 👇 Optionally keep the button disabled or enable it after delay
                // setTimeout(() => setIsSending(false), 60000); // Example: enable after 60 sec
            } else {
                setError(data.message || "Error occurred.");
                setIsSending(false); // 👈 Re-enable if there was an error
            }
        } catch (err) {
            console.error(err);
            setError("Failed to connect to server.");
            setIsSending(false); // 👈 Re-enable if there was an error
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
            <div className="card p-4 shadow" style={{ width: "400px" }}>
                <h2 className="text-center mb-3">Forgot Password</h2>
                <form onSubmit={handleForgotPassword}>
                    <div className="mb-3">
                        <label className="form-label">Enter your email</label>
                        <input
                            type="email"
                            className="form-control"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setIsSending(false); // reset if you want them to try again with a different email
                            }}
                            required
                            disabled={isSending} // 👈 Optional: Disable input when sending
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={isSending} // 👈 Disable button if isSending is true
                    >
                        {isSending ? "Reset Link Sent" : "Send Reset Link"}
                    </button>
                </form>

                {message && <p className="text-success mt-3">{message}</p>}
                {error && <p className="text-danger mt-3">{error}</p>}
            </div>
        </div>
    );
};

export default ForgotPassword;
