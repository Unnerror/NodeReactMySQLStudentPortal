import React, { useEffect, useState } from "react";

const ManageUsersTable = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("https://localhost:3443/api/admin/users", { credentials: "include" });
            const data = await res.json();

            // ✅ Defensive check — make sure it’s an array
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("❌ Failed to fetch users", err);
            setUsers([]); // fallback to prevent .map crash
        }
    };

    const fetchRoles = async () => {
        const res = await fetch("https://localhost:3443/api/admin/roles", { credentials: "include" });
        const data = await res.json();
        setRoles(data);
    };

    const handleChange = (index, field, value) => {
        const updated = [...users];
        updated[index][field] = value;
        setUsers(updated);
    };

    const handleSave = async (user) => {
        const res = await fetch(`https://localhost:3443/api/admin/users`, {
            method: user.id ? "PUT" : "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user)
        });

        if (res.ok) {
            fetchUsers();
        } else {
            alert("Failed to save user");
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm("Are you sure?")) return;
        const res = await fetch(`https://localhost:3443/api/admin/users/${userId}`, {
            method: "DELETE",
            credentials: "include"
        });

        if (res.ok) fetchUsers();
    };

    return (
        <div>
            <h4 className="mb-3">Manage Users</h4>
            <table className="table table-bordered">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Save</th>
                    <th>Delete</th>
                </tr>
                </thead>
                <tbody>
                {users.map((user, index) => (
                    <tr key={user.id || index}>
                        <td>{user.id || "New"}</td>
                        <td>
                            <input
                                value={user.email}
                                onChange={(e) => handleChange(index, "email", e.target.value)}
                                className="form-control"
                            />
                        </td>
                        <td>
                            <select
                                className="form-select"
                                value={user.role_id}
                                onChange={(e) => handleChange(index, "role_id", e.target.value)}
                            >
                                {Array.isArray(roles) && roles.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.role_name}
                                    </option>
                                ))}
                            </select>
                        </td>
                        <td>
                            <button className="btn btn-success" onClick={() => handleSave(user)}>Save</button>
                        </td>
                        <td>
                            {user.id && (
                                <button className="btn btn-danger" onClick={() => handleDelete(user.id)}>Delete</button>
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default ManageUsersTable;
