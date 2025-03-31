import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!token || !user) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireAdmin && !user.isAdmin) {
        // Redirect to dashboard if not admin
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute; 