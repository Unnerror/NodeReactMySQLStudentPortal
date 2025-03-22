import React from "react";
import { useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

const Dashboard = () => {
    const navigate = useNavigate();

    const handleEditProfile = () => {
        // Redirect to edit profile page (you can create this later)
        navigate('/profile');
    };

    const handleSignOut = () => {
        // Logic for logout (clear tokens, etc.), then navigate to home
        navigate('/');
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





/*import React from "react";

const Dashboard = () => {
    return (
        <div className="container text-center mt-5">
            <h1>Dashboard</h1>
            <p>Dashboard</p>
        </div>
    );
};

export default Dashboard;
*/