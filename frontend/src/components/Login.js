import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
                credentials: "include" // 👈 this is mandatory for sessions to work!
            });


            const data = await response.json();

            if (response.ok) {
                // ✅ Redirect to 2FA after successful password login
                navigate("/two-factor", { state: { userId: data.userId } });
            } else {
                alert("Login Failed: " + data.error);
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Error connecting to server.");
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
            <h1 className="position-absolute top-0 start-50 translate-middle-x mt-5">Student Portal</h1>
            <div className="card p-4 shadow" style={{ width: "400px" }}>
                <h2 className="text-center">Login</h2>
                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">
                        Login
                    </button>
                    <p className="mt-2 text-left">
                        or{" "}
                        <Link
                            to="/register"
                            className="link-secondary link-offset-2 link-underline-opacity-25 link-underline-opacity-50-hover"
                        >
                            create
                        </Link>{" "}
                        account
                    </p>
                    <Link
                        to="/forgot-password"
                        className="link-secondary link-offset-2 link-underline-opacity-0 link-underline-opacity-25-hover"
                    >
                        Forgot password?
                    </Link>
                </form>
            </div>
        </div>
    );
};

export default Login;
