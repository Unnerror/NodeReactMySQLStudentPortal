// hooks/useAuth.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [role, setRole] = useState(null); // 👈 Add role state
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch("https://localhost:3443/api/auth-user", {
                    credentials: "include", // ✅ Required for sessions
                });

                if (res.ok) {
                    const data = await res.json();
                    console.log("Auth User Data:", data); // ✅ Debug API response here

                    setIsAuthenticated(true);
                    setRole(data.role_id); // ✅ Store role in state
                } else {
                    navigate("/login");
                }
            } catch (err) {
                console.error("Auth check failed", err);
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [navigate]);

    return { loading, isAuthenticated, role };
};
