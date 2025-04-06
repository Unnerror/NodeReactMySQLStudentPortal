import React, { useEffect, useState } from "react";
import StudentManager from "./StudentManager";

const ManageCoursesTable = () => {
    const [courses, setCourses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [newCourse, setNewCourse] = useState({
        title: "",
        description: "",
        teacher_id: ""
    });
    const [managingCourseId, setManagingCourseId] = useState(null);
    const [enrollmentCounts, setEnrollmentCounts] = useState({});

    useEffect(() => {
        fetchCourses();
        fetchTeachers();
        fetchEnrollmentCounts();
    }, []);

    const fetchCourses = async () => {
        const res = await fetch("https://localhost:3443/api/admin/courses", { credentials: "include" });
        const data = await res.json();
        setCourses(data);
    };

    const fetchTeachers = async () => {
        const res = await fetch("https://localhost:3443/api/admin/teachers", { credentials: "include" });
        const data = await res.json();
        setTeachers(data);
    };

    const handleExistingCourseChange = (index, field, value) => {
        const updated = [...courses];
        updated[index][field] = value;
        setCourses(updated);
    };

    const handleNewCourseChange = (e) => {
        const { name, value } = e.target;
        setNewCourse(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async (course) => {
        const courseToSend = { ...course };
        if (!courseToSend.teacher_id) {
            delete courseToSend.teacher_id; // Optional
        }

        const isNew = !courseToSend.id;
        const method = isNew ? "POST" : "PUT";
        const url = isNew
            ? "https://localhost:3443/api/admin/courses"
            : `https://localhost:3443/api/admin/courses/${courseToSend.id}`;

        const res = await fetch(url, {
            method,
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(courseToSend),
        });

        if (res.ok) {
            setNewCourse({ title: "", description: "", teacher_id: "" });
            fetchCourses();
        } else {
            const error = await res.json();
            console.error("❌ Save failed:", error);
            alert("Failed to save course: " + error.error);
        }
    };

    const handleDelete = async (courseId) => {
        if (!window.confirm("Are you sure you want to delete this course?")) return;

        const res = await fetch(`https://localhost:3443/api/admin/courses/${courseId}`, {
            method: "DELETE",
            credentials: "include"
        });

        if (res.ok) {
            fetchCourses(); // Refresh after delete
        } else {
            const error = await res.json();
            alert("Failed to delete course: " + error.error);
        }
    };

    const renderRow = (course, index, isNew = false) => (
        <tr key={index}>
            <td>{course.id || "New"}</td> {/* Show ID here */}
            <td>
                <input
                    type="text"
                    name="title"
                    value={course.title}
                    onChange={(e) =>
                        isNew
                            ? handleNewCourseChange(e)
                            : handleExistingCourseChange(index, "title", e.target.value)
                    }
                    className="form-control"
                />
            </td>
            <td>
                <input
                    type="text"
                    name="description"
                    value={course.description}
                    onChange={(e) =>
                        isNew
                            ? handleNewCourseChange(e)
                            : handleExistingCourseChange(index, "description", e.target.value)
                    }
                    className="form-control"
                />
            </td>
            <td>
                <select
                    name="teacher_id"
                    className="form-select"
                    value={course.teacher_id || ""}
                    onChange={(e) =>
                        isNew
                            ? handleNewCourseChange(e)
                            : handleExistingCourseChange(index, "teacher_id", e.target.value)
                    }
                >
                    <option value="">None</option>
                    {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.email}
                        </option>
                    ))}
                </select>
            </td>
            <td>
                {course.id ? enrollmentCounts[course.id] || 0 : ""}
            </td>
            <td>
                <button className="btn btn-success" onClick={() => handleSave(course)}>
                    Save
                </button>
            </td>
            <td>
                {!isNew && (
                    <button className="btn btn-danger" onClick={() => handleDelete(course.id)}>
                        Delete
                    </button>
                )}
            </td>
            <td>
                {course.id && (
                    <button
                        className="btn btn-secondary"
                        onClick={() => setManagingCourseId(course.id)} // ✅ instead of alert
                    >
                        Manage Students
                    </button>
                )}
            </td>
        </tr>
    );

    const fetchEnrollmentCounts = async () => {
        const res = await fetch("https://localhost:3443/api/admin/course-enrollments-count", { credentials: "include" });
        const data = await res.json();
        const mapped = {};
        data.forEach((item) => {
            mapped[item.course_id] = item.count;
        });
        setEnrollmentCounts(mapped); // { 1: 5, 2: 0, ... }
    };

    return (
        <div>
            <h4 className="mb-3">All Courses</h4>
            <table className="table table-bordered">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Teacher</th>
                    <th>Enrolled</th>
                    <th>Save</th>
                    <th>Delete</th>
                    <th>Students</th>
                </tr>
                </thead>
                <tbody>
                {courses.map((course, index) => renderRow(course, index))}
                {renderRow(newCourse, courses.length, true)} {/* New Course Row */}
                </tbody>
            </table>
            {managingCourseId && (
                <StudentManager
                    courseId={managingCourseId}
                    onClose={() => setManagingCourseId(null)}
                />
            )}
        </div>
    );
};

export default ManageCoursesTable;
