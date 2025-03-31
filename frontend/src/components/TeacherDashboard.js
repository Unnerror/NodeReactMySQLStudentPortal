// src/components/TeacherDashboard.js
import React from "react";
import { useNavigate } from "react-router-dom";

const TeacherDashboard = () => {
    const navigate = useNavigate();

    return (
        <div>
            <h3>Teacher Panel</h3>
            <ul>
                <li>
                    <button onClick={() => navigate("/my-courses")}>
                        My Courses
                    </button>
                </li>
                <li>
                    <button onClick={() => navigate("/view-students")}>
                        View Enrolled Students
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

export default TeacherDashboard;
