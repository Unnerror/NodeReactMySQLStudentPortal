import React, { useEffect, useState } from "react";

const StudentManager = ({ courseId, onClose }) => {
    const [students, setStudents] = useState([]);
    const [enrolled, setEnrolled] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState("");

    useEffect(() => {
        if (courseId) {
            fetchAllStudents();
            fetchEnrolledStudents();
        }
    }, [courseId]);


    const fetchAllStudents = async () => {
        const res = await fetch("https://localhost:3443/api/admin/students", { credentials: "include" });
        const data = await res.json();
        setStudents(data);
    };

    const fetchEnrolledStudents = async () => {
        const res = await fetch(`https://localhost:3443/api/admin/courses/${courseId}/students`, { credentials: "include" });
        const data = await res.json();
        // Protect against non-array responses
        setEnrolled(Array.isArray(data) ? data : []);
    };


    const handleAddStudent = async () => {
        const res = await fetch(`https://localhost:3443/api/admin/courses/${courseId}/students`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentId: parseInt(selectedStudentId, 10) }),
        });
        if (res.ok) {
            fetchEnrolledStudents();
            setSelectedStudentId("");
        }
    };

    const handleRemoveStudent = async (studentId) => {
        await fetch(`https://localhost:3443/api/admin/courses/${courseId}/students/${studentId}`, {
            method: "DELETE",
            credentials: "include",
        });
        fetchEnrolledStudents();
    };

    return (
        <div className="mt-4 p-3 border bg-light">
            <h5>Manage Students for Course #{courseId}</h5>
            <ul className="list-group mb-3">
                {enrolled.map((student) => (
                    <li key={student.id} className="list-group-item d-flex justify-content-between">
                        {student.email}
                        <button className="btn btn-sm btn-danger" onClick={() => handleRemoveStudent(student.id)}>Remove</button>
                    </li>
                ))}
            </ul>

            <div className="d-flex gap-2">
                <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="form-select"
                >
                    <option value="">Select Student</option>
                    {students
                        .filter((s) => !enrolled.some((e) => e.id === s.id))
                        .map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.email}
                            </option>
                        ))}
                </select>
                <button className="btn btn-primary" onClick={handleAddStudent}>Add</button>
                <button className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default StudentManager;
