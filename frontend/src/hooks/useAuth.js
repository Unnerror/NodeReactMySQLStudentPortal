import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch("https://localhost:3443/api/dashboard-data", {
                    credentials: "include", // 👈 required to include session cookie
                });

                if (res.ok) {
                    setIsAuthenticated(true);
                } else {
                    navigate("/login");
                }
            } catch (err) {
                console.error("Auth check   failed", err);
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [navigate]);

    return { loading, isAuthenticated };
};
