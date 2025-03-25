import React, {useEffect} from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

const Dashboard = () => {

    const navigate = useNavigate();
    const { loading, isAuthenticated } = useAuth();

    // ✅ Safe to call useEffect AFTER all hooks
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate("/login");
        }
    }, [loading, isAuthenticated, navigate]);

    // ✅ Don’t render UI while still checking auth
    if (loading) return null;

    const handleEditProfile = () => {
        // Redirect to edit profile page (you can create this later)
        navigate('/profile');
    };

    const handleSignOut = async () => {
        await fetch(`${process.env.REACT_APP_BACKEND_URL}/logout`, {
            method: "POST",
            credentials: "include"
        });
        navigate('/login');
    };

    return (
        <div>
            {/* Header */}
            <nav className="navbar navbar-light bg-light justify-content-between px-4">
                <span className="navbar-brand mb-0 h1">Student Portal</span>
                <div className="dropdown">
                    <button
                        className="btn btn-secondary dropdown-toggle"
                        type="button"
                        id="accountDropdown"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                    >
                        My Account
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="accountDropdown">
                        <li><button className="dropdown-item" onClick={handleEditProfile}>Edit Profile</button></li>
                        <li><hr className="dropdown-divider" /></li>
                        <li><button className="dropdown-item" onClick={handleSignOut}>Sign Out</button></li>
                    </ul>
                </div>
            </nav>

            {/* Page Content */}
            <div className="container mt-5 text-center">
                <h2>Dashboard</h2>
                <p>Welcome to your dashboard!</p>
                {/* Add more dashboard content here */}
            </div>
        </div>
    );
};

export default Dashboard;