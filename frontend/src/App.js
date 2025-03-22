import React from "react";
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./custom.css";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";

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
        <div>
            {showHomeHeader && (
                <div className="container text-center mt-5">
                    <h1>Student Portal</h1>
                    <nav className="mb-3">
                        <Link to="/login" className="btn btn-primary mx-2">
                            Login
                        </Link>
                        <Link to="/register" className="btn btn-success mx-2">
                            Register
                        </Link>
                    </nav>
                </div>
            )}

            <Routes>
                <Route path="/" element={<div className="text-center mt-5"><h2>Welcome to Student Portal!</h2></div>} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </div>
    );
};

export default AppWrapper;







/*import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./custom.css";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard"; // Import the Dashboard component

const App = () => {
    return (
        <Router>
            <div className="container text-center mt-5">
                <h1>Student Portal</h1>
                <nav className="mb-3">
                    <Link to="/login" className="btn btn-primary mx-2">Login</Link>
                    <Link to="/register" className="btn btn-success mx-2">Register</Link>
                </nav>
            </div>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </Router>
    );
};

export default App;
*/