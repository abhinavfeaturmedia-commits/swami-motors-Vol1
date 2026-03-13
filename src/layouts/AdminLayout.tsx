import React, { useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, Search, Plus, ChevronDown, LogOut, Home } from 'lucide-react';
import clsx from 'clsx';

interface NavGroup {
    label: string;
    items: { name: string; href: string; icon: string }[];
}

const NAV_GROUPS: NavGroup[] = [
    {
        label: 'Main',
        items: [
            { name: 'Dashboard', href: '/admin', icon: 'dashboard' },
            { name: 'Inventory', href: '/admin/inventory', icon: 'directions_car' },
            { name: 'Leads', href: '/admin/leads', icon: 'people' },
            { name: 'Sales', href: '/admin/sales', icon: 'point_of_sale' },
            { name: 'Bookings', href: '/admin/bookings', icon: 'event' },
        ],
    },
    {
        label: 'Analytics',
        items: [
            { name: 'Analytics', href: '/admin/analytics', icon: 'analytics' },
            { name: 'Reports', href: '/admin/reports', icon: 'description' },
            { name: 'Performance', href: '/admin/performance', icon: 'leaderboard' },
        ],
    },
    {
        label: 'CRM',
        items: [
            { name: 'Customers', href: '/admin/customers', icon: 'contacts' },
            { name: 'Follow-Ups', href: '/admin/follow-ups', icon: 'notifications_active' },
            { name: 'Lead Sources', href: '/admin/lead-sources', icon: 'hub' },
        ],
    },
    {
        label: 'Operations',
        items: [
            { name: 'Inspections', href: '/admin/inspections', icon: 'checklist' },
            { name: 'Documents', href: '/admin/documents', icon: 'folder' },
            { name: 'Price History', href: '/admin/price-history', icon: 'trending_up' },
            { name: 'Expenses', href: '/admin/expenses', icon: 'receipt_long' },
        ],
    },
    {
        label: 'Finance',
        items: [
            { name: 'Accounts', href: '/admin/accounts', icon: 'account_balance' },
            { name: 'Commissions', href: '/admin/commissions', icon: 'payments' },
            { name: 'Tax & GST', href: '/admin/tax', icon: 'receipt' },
        ],
    },
    {
        label: 'Schedule',
        items: [
            { name: 'Calendar', href: '/admin/calendar', icon: 'calendar_month' },
            { name: 'Notifications', href: '/admin/notifications', icon: 'notifications' },
            { name: 'Templates', href: '/admin/templates', icon: 'chat' },
        ],
    },
    {
        label: 'Admin',
        items: [
            { name: 'Users', href: '/admin/users', icon: 'manage_accounts' },
            { name: 'Audit Logs', href: '/admin/audit-logs', icon: 'history' },
            { name: 'Feedback', href: '/admin/feedback', icon: 'reviews' },
            { name: 'Settings', href: '/admin/settings', icon: 'settings' },
        ],
    },
];

const AdminLayout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear any admin session/auth data
        localStorage.removeItem('adminAuth');
        sessionStorage.removeItem('adminAuth');
        navigate('/admin/login');
    };

    const isNavActive = (href: string) => {
        if (href === '/admin') return location.pathname === '/admin';
        return location.pathname.startsWith(href);
    };

    const toggleGroup = (label: string) => setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));

    // Auto-expand group containing active route
    const activeGroup = NAV_GROUPS.find(g => g.items.some(i => isNavActive(i.href)));

    return (
        <div className="min-h-screen w-full bg-slate-50 flex font-body">
            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-primary/20 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={clsx(
                    "fixed top-0 left-0 z-40 h-screen transition-transform duration-300 ease-in-out bg-white border-r border-slate-100 flex flex-col",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                    "w-64"
                )}
            >
                {/* Header */}
                <div className="h-[4.5rem] flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
                    <Link to="/admin" className="flex items-center gap-3">
                        <div className="size-9 bg-primary rounded-xl flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-lg">directions_car</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-primary font-display">SSSM Admin</p>
                            <p className="text-[10px] text-slate-400">Kolhapur Branch</p>
                        </div>
                    </Link>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-3 px-3 overflow-y-auto flex flex-col min-h-0">
                    <div className="flex-1">
                        {NAV_GROUPS.map(group => {
                            const isOpen = !collapsed[group.label] || (activeGroup?.label === group.label);
                            const hasActive = group.items.some(i => isNavActive(i.href));

                            return (
                                <div key={group.label} className="mb-1">
                                    <button
                                        onClick={() => toggleGroup(group.label)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
                                    >
                                        <span className={hasActive ? 'text-primary' : ''}>{group.label}</span>
                                        <ChevronDown size={12} className={clsx('transition-transform', isOpen ? '' : '-rotate-90')} />
                                    </button>

                                    {isOpen && (
                                        <div className="space-y-0.5">
                                            {group.items.map(item => {
                                                const active = isNavActive(item.href);
                                                return (
                                                    <Link
                                                        key={item.href}
                                                        to={item.href}
                                                        onClick={() => setSidebarOpen(false)}
                                                        className={clsx(
                                                            "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200",
                                                            active
                                                                ? "bg-primary text-white shadow-sm shadow-primary/20"
                                                                : "text-slate-600 hover:bg-slate-50 hover:text-primary"
                                                        )}
                                                    >
                                                        <span className={clsx("material-symbols-outlined text-[18px]", active ? "text-white" : "text-slate-400")}>{item.icon}</span>
                                                        {item.name}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-auto px-1 pb-4 shrink-0 space-y-2 border-t border-slate-100 pt-5">
                        <Link
                            to="/admin/inventory/new"
                            className="flex items-center justify-center gap-2 w-full h-10 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors shadow-sm"
                        >
                            <Plus size={16} /> New Listing
                        </Link>
                        <Link
                            to="/"
                            className="flex items-center justify-center gap-2 w-full h-10 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-100 hover:text-primary transition-colors"
                        >
                            <Home size={15} /> View Website
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-2 w-full h-10 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 hover:text-red-700 transition-colors"
                        >
                            <LogOut size={15} /> Logout
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden lg:pl-64">
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-8 shrink-0">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 -ml-2 text-slate-400 hover:text-primary lg:hidden"
                        >
                            <Menu size={22} />
                        </button>
                        <h2 className="hidden lg:block text-lg font-bold text-primary font-display">Admin Command Center</h2>
                        <div className="hidden sm:flex items-center gap-2 bg-slate-50 rounded-xl px-4 h-10 border border-slate-100 focus-within:ring-2 focus-within:ring-primary/10 transition-all flex-1 max-w-md ml-4">
                            <Search size={16} className="text-slate-400 shrink-0" />
                            <input className="bg-transparent border-none text-sm text-primary placeholder:text-slate-400 w-full outline-none" placeholder="Search inquiries, VIN, or customers..." />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            to="/"
                            title="Go to Website"
                            className="hidden sm:flex items-center gap-1.5 h-9 px-3 text-slate-500 bg-slate-50 border border-slate-200 hover:text-primary hover:bg-slate-100 rounded-xl transition-colors text-sm font-medium"
                        >
                            <Home size={15} />
                            <span className="hidden lg:inline">Website</span>
                        </Link>
                        <Link to="/admin/notifications" className="relative p-2.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-xl transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger ring-2 ring-white"></span>
                        </Link>
                        <div className="flex items-center gap-3 pl-3 border-l border-slate-100">
                            <div className="size-9 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-xs font-bold shadow-sm">VS</div>
                            <div className="hidden md:block">
                                <p className="text-sm font-semibold text-primary">Vikas Shinde</p>
                                <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">General Manager</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Logout"
                            className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
