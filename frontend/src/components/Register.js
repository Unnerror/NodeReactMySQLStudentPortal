import React, { useState } from "react";
import {Link, useNavigate} from 'react-router-dom';

const Register = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("https://127.0.0.1:3443/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            if (response.ok) {
                alert("Registration Successful: You can now log in.");
                navigate("/login", { state: { userId: data.userId } });
            } else {
                alert("Registration Failed: " + data.error);
            }
        } catch (error) {
            console.error("Registration error:", error);
            alert("Error connecting to server.");
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
            <h1 className="position-absolute top-0 start-50 translate-middle-x mt-5">Student Portal</h1>
            <div className="card p-4 shadow" style={{ width: "400px" }}>
                <h2 className="text-center">Register</h2>
                <form onSubmit={handleRegister}>
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
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-success w-100">
                        Register
                    </button>
                    <p className="mt-2 text-left">
                        or <Link to="/login" className="link-secondary link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover">
                        login</Link> to account
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Register;