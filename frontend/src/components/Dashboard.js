import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

import ManageCoursesTable from "./ManageCoursesTable";
import ManageUsersTable from "./ManageUsersTable";
import MyCoursesTable from "./MyCoursesTable";
import EnrolledStudentsTable from "./EnrolledStudentsTable";
import StudentEnrollmentTable from "./StudentEnrollmentTable";
import SearchCourses from "./SearchCourses";

const Dashboard = () => {
    const navigate = useNavigate();
    const { loading, isAuthenticated, role, userId, email } = useAuth();
    const [activeTab, setActiveTab] = useState("search");

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate("/login");
        }
    }, [loading, isAuthenticated, navigate]);

    const handleEditProfile = () => navigate("/profile");
    const handleSignOut = async () => {
        await fetch(`${process.env.REACT_APP_BACKEND_URL}/logout`, {
            method: "POST",
            credentials: "include",
        });
        navigate("/login");
    };

    const renderTable = () => {
        switch (activeTab) {
            case "allCourses":
                return <ManageCoursesTable isAdmin={true} />;
            case "manageUsers":
                return <ManageUsersTable />;
            case "myCourses":
                return <MyCoursesTable userId={userId} />;
            case "viewStudents":
                return <EnrolledStudentsTable />;
            case "enroll":
                return <StudentEnrollmentTable userId={userId} />;
            case "search":
                return <SearchCourses />;
            default:
                return null;
        }
    };

    if (loading) return null;

    return (
        <div>
            {/* Top Nav */}
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
                        <li>
                            <button className="dropdown-item" onClick={handleEditProfile}>Edit Profile</button>
                        </li>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                            <button className="dropdown-item" onClick={handleSignOut}>Sign Out</button>
                        </li>
                    </ul>
                </div>
            </nav>

            {/* Role + Email Panel */}
            <div className="container mt-4 text-center">
                <h3>
                    {role === 1 && "Admin Panel"}
                    {role === 2 && "Teacher Panel"}
                    {role === 3 && "Student Panel"}
                </h3>
                <p className="text-muted">{email && `Logged in as: ${email}`}</p>

                {/* Inline Role-Based Tabs */}
                <div className="d-flex justify-content-center gap-3 my-3 flex-wrap">
                    {role === 1 && (
                        <>
                            <button className="btn btn-primary" onClick={() => setActiveTab("allCourses")}>Manage Courses</button>
                            <button className="btn btn-secondary" onClick={() => setActiveTab("manageUsers")}>Manage Users</button>
                            <button className="btn btn-outline-dark" onClick={() => setActiveTab("search")}>Search Courses</button>
                        </>
                    )}
                    {role === 2 && (
                        <>
                            <button className="btn btn-primary" onClick={() => setActiveTab("myCourses")}>My Courses</button>
                            <button className="btn btn-outline-dark" onClick={() => setActiveTab("search")}>Search Courses</button>
                        </>
                    )}
                    {role === 3 && (
                        <>
                            <button className="btn btn-primary" onClick={() => setActiveTab("enroll")}>Enroll in Courses</button>
                            <button className="btn btn-outline-dark" onClick={() => setActiveTab("search")}>Search Courses</button>
                        </>
                    )}
                </div>

                {/* Table Content */}
                <div className="mt-4">{renderTable()}</div>
            </div>
        </div>
    );
};

export default Dashboard;
