import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * ProtectedRoute - Component that renders children only if user is authenticated
 * and has the required role (if specified)
 */
export default function ProtectedRoute({ 
  children, 
  requiredRole = null, 
  fallback = null 
}) {
  const { user, isAuthenticated, loading } = useContext(AuthContext);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <i className="fa-solid fa-circle-notch fa-spin text-4xl text-indigo-600 mb-4"></i>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated || !user) {
    return fallback || (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Authentication Required</h2>
        <p className="text-slate-600 mb-6">Please login to access this page.</p>
      </div>
    );
  }

  // Check role if required - silently redirect or show fallback
  if (requiredRole && user.role !== requiredRole) {
    // Don't show error message, just redirect to appropriate dashboard
    if (fallback) {
      return fallback;
    }
    // Silently return null or redirect - don't show error to user
    return null;
  }

  // User is authenticated and has required role
  return <>{children}</>;
}


