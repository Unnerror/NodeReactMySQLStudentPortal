import React, { useEffect, useState } from "react";

const StudentEnrollmentTable = () => {
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        fetch("https://localhost:3443/api/student/enrollments", { credentials: "include" })
            .then(res => res.json())
            .then(setCourses)
            .catch(err => {
                console.error("❌ Failed to fetch enrolled courses:", err);
                setCourses([]);
            });
    }, []);

    return (
        <div>
            <h4 className="mb-3">My Enrolled Courses</h4>
            <table className="table table-bordered">
                <thead>
                <tr>
                    <th>Course ID</th>
                    <th>Course Name</th>
                    <th>Description</th>
                    <th>Teacher</th>
                </tr>
                </thead>
                <tbody>
                {courses.length === 0 ? (
                    <tr>
                        <td colSpan="4" className="text-center">You are not enrolled in any courses.</td>
                    </tr>
                ) : (
                    courses.map(course => (
                        <tr key={course.id}>
                            <td>{course.id}</td>
                            <td>{course.title}</td>
                            <td>{course.description}</td>
                            <td>{course.teacher_email || ""}</td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
    );
};

export default StudentEnrollmentTable;
