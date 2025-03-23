import React, { useState } from "react";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleForgotPassword = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("https://localhost:3443/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage("Password reset link sent! Check your email.");
                setError("");
            } else {
                setError(data.message || "Error occurred.");
                setMessage("");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to connect to server.");
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
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">
                        Send Reset Link
                    </button>
                </form>
                {message && <p className="text-success mt-3">{message}</p>}
                {error && <p className="text-danger mt-3">{error}</p>}
            </div>
        </div>
    );
};

export default ForgotPassword;
