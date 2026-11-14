import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// ─── Loading Spinner (used while session initialises) ─────────────────────────

const AuthLoader: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
            <div className="size-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white text-2xl">directions_car</span>
            </div>
            <div className="flex gap-1.5">
                <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
            </div>
            <p className="text-sm text-slate-400 font-medium">Verifying session…</p>
        </div>
    </div>
);

// ─── Admin Route Guard ────────────────────────────────────────────────────────
// Redirects to /admin/login if the user is not logged in or not an admin.

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, profile, loading, isAdmin, isStaff } = useAuth();
    const location = useLocation();

    if (loading) return <AuthLoader />;

    // Not logged in at all
    if (!user) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    // Profile is still loading — show loader rather than flicker
    if (!profile) return <AuthLoader />;

    // Only admins and staff can access the admin panel
    // Customers are redirected to the public site
    if (!isAdmin && !isStaff) {
        return <Navigate to="/" replace />;
    }

    // Inactive staff accounts are blocked
    if ((isAdmin || isStaff) && profile.is_active === false) {
        return <Navigate to="/admin/login" replace />;
    }

    return <>{children}</>;
};

// ─── Access Restricted Fallback ───────────────────────────────────────────────

const AccessRestricted: React.FC<{ module: string }> = ({ module }) => {
    const navigate = useNavigate();
    const formattedModule = module.charAt(0).toUpperCase() + module.slice(1).replace(/_/g, ' ');

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="size-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
                <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 font-display mb-2">Access Restricted</h2>
            <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
                You do not have permission to view the <span className="font-semibold text-slate-700">{formattedModule}</span> module. If you need access, please contact an administrator to update your user role permissions.
            </p>
            <button
                onClick={() => navigate('/admin')}
                className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
            >
                <span className="material-symbols-outlined text-lg">dashboard</span>
                Return to Dashboard
            </button>
        </div>
    );
};

// ─── Module Route Guard ───────────────────────────────────────────────────────
// Protects individual routes based on module access permissions.

export const ModuleRoute: React.FC<{ module: string, children: React.ReactNode }> = ({ module, children }) => {
    const { hasPermission, isAdmin } = useAuth();
    
    // Admins always have access, staff must have explicitly granted 'view' permission for the module.
    if (!isAdmin && !hasPermission(module, 'view')) {
        return <AccessRestricted module={module} />;
    }
    
    return <>{children}</>;
};

// ─── User Route Guard ─────────────────────────────────────────────────────────
// Redirects to /auth if the user is not logged in.

export const UserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <AuthLoader />;

    if (!user) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
