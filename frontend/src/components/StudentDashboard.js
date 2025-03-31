// src/components/StudentDashboard.js
import React from "react";
import { useNavigate } from "react-router-dom";

const StudentDashboard = () => {
    const navigate = useNavigate();

    return (
        <div>
            <h3>Student Panel</h3>
            <ul>
                <li>
                    <button onClick={() => navigate("/enroll-courses")}>
                        Enroll in Courses
                    </button>
                </li>
                <li>
                    <button onClick={() => navigate("/my-progress")}>
                        View My Progress
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

export default StudentDashboard;
