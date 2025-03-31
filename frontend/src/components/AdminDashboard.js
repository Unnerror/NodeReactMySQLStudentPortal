// src/components/AdminDashboard.js
import React from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
    const navigate = useNavigate();

    return (
        <div>
            <h3>Admin Panel</h3>
            <ul>
                <li>
                    <button onClick={() => navigate("/manage-courses")}>
                        Manage Courses
                    </button>
                </li>
                <li>
                    <button onClick={() => navigate("/manage-users")}>
                        Manage Users
                    </button>
                </li>
                <li>
                    <button onClick={() => navigate("/search-courses")}>
                        Search Courses
                    </button>
                </li>
            </ul>
        </div>
    );
};

export default AdminDashboard;
