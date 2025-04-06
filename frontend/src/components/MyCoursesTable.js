import React, { useEffect, useState } from "react";

const MyCoursesTable = ({ userId }) => {
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        fetchMyCourses();
    }, []);

    const fetchMyCourses = async () => {
        try {
            const res = await fetch(`https://localhost:3443/api/teacher/my-courses?teacherId=${userId}`, {
                credentials: "include",
            });
            const data = await res.json();
            setCourses(data);
        } catch (err) {
            console.error("❌ Failed to fetch teacher courses", err);
            setCourses([]);
        }
    };

    return (
        <div>
            <h4 className="mb-3">My Courses</h4>
            <table className="table table-bordered">
                <thead>
                <tr>
                    <th>Course ID</th>
                    <th>Course Name</th>
                    <th>Description</th>
                    <th>Enrolled Students</th>
                </tr>
                </thead>
                <tbody>
                {courses.map((course) => (
                    <tr key={course.id}>
                        <td>{course.id}</td>
                        <td>{course.title}</td>
                        <td>{course.description}</td>
                        <td>{course.enrolled_students || 0}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default MyCoursesTable;
