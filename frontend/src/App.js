import React from "react";
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./custom.css";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

// Create a wrapper to use hooks like useLocation in App.js
const AppWrapper = () => {
    return (
        <Router>
            <App />
        </Router>
    );
};

const App = () => {
    const location = useLocation();

    // Only show homepage header on "/" route
    const showHomeHeader = location.pathname === "/";

    return (
        <div className="d-flex flex-column min-vh-100 bg-light">
            {showHomeHeader && (
                <div className="d-flex flex-column justify-content-center align-items-center flex-grow-1">
                    <h1 className="position-absolute top-0 start-50 translate-middle-x mt-5">Student Portal</h1>
                    <div className="card p-4 shadow" style={{ width: "400px" }}>
                        <h2 className="text-center mb-4">Welcome!</h2>
                        <nav className="d-flex justify-content-center">
                            <Link to="/login" className="btn btn-primary mx-2">
                                Login
                            </Link>
                            <Link to="/register" className="btn btn-success mx-2">
                                Register
                            </Link>
                        </nav>
                    </div>
                </div>
            )}

            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
            </Routes>
        </div>
    );
};

export default AppWrapper