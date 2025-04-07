// https://localhost:3000/vuln-login
/*
' OR 1=1 --
qwer
*/

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const VulnLogin = () => {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch("https://localhost:3443/api/vuln-login", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Login failed");
            }

            alert(`✅ Welcome, role ID: ${data.role_id}`);
            navigate("/vuln-search");

        } catch (err) {
            alert("❌ Login failed: " + err.message);
        }
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center">Vulnerable Login</h2>
            <form onSubmit={handleSubmit} className="w-50 mx-auto">
                <input
                    type="text"
                    name="email"
                    className="form-control my-2"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                />
                <input
                    type="password"
                    name="password"
                    className="form-control my-2"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                />
                <button type="submit" className="btn btn-danger w-100">
                    Login (Insecure)
                </button>
            </form>
        </div>
    );
};

export default VulnLogin;
