import React, { useEffect, useState } from "react";

const SearchCourses = () => {
    const [query, setQuery] = useState("");
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        fetchCourses(); // initial load with all
    }, []);

    const fetchCourses = async (search = "") => {
        const res = await fetch(`https://localhost:3443/api/courses/search?query=${search}`, {
            credentials: "include"
        });
        const data = await res.json();
        setCourses(data);
    };

    const handleSearch = () => {
        fetchCourses(query);
    };

    return (
        <div className="container">
            <div className="d-flex gap-2 mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Enter user email or course name to see associated courses"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <button className="btn btn-primary" onClick={handleSearch}>Search</button>
            </div>

            <table className="table table-bordered">
                <thead>
                <tr>
                    <th>Course ID</th>
                    <th>Course Name</th>
                    <th>Description</th>
                    <th>Teacher</th>
                    <th>Enrolled Students</th>
                </tr>
                </thead>
                <tbody>
                {courses.map((c) => (
                    <tr key={c.course_id}>
                        <td>{c.course_id}</td>
                        <td>{c.course_name}</td>
                        <td>{c.course_desc}</td>
                        <td>{c.teacher_email || ""}</td>
                        <td>{c.enrolled_count}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default SearchCourses;
