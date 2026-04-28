import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, Plus, ChevronDown, LogOut, Home } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { DataProvider, useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabase';
import GlobalSearch from '../components/admin/GlobalSearch';

interface NavItem {
    name: string;
    href: string;
    icon: string;
    module: string; // maps to user_permissions.module
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
    {
        label: 'Main',
        items: [
            { name: 'Dashboard', href: '/admin', icon: 'dashboard', module: 'dashboard' },
            { name: 'Inventory', href: '/admin/inventory', icon: 'directions_car', module: 'inventory' },
            { name: 'Consignments', href: '/admin/consignments', icon: 'handshake', module: 'inventory' },
            { name: 'Leads', href: '/admin/leads', icon: 'people', module: 'leads' },
            { name: 'Sales', href: '/admin/sales', icon: 'point_of_sale', module: 'sales' },
            { name: 'Bookings', href: '/admin/bookings', icon: 'event', module: 'bookings' },
            { name: 'Incentives', href: '/admin/incentives', icon: 'workspace_premium', module: 'incentives' },
        ],
    },
    {
        label: 'Analytics',
        items: [
            { name: 'Analytics', href: '/admin/analytics', icon: 'analytics', module: 'analytics' },
            { name: 'Reports', href: '/admin/reports', icon: 'description', module: 'analytics' },
            { name: 'Performance', href: '/admin/performance', icon: 'leaderboard', module: 'analytics' },
        ],
    },
    {
        label: 'CRM',
        items: [
            { name: 'Customers', href: '/admin/customers', icon: 'contacts', module: 'crm' },
            { name: 'Follow-Ups', href: '/admin/follow-ups', icon: 'notifications_active', module: 'crm' },
            { name: 'Lead Sources', href: '/admin/lead-sources', icon: 'hub', module: 'crm' },
        ],
    },
    {
        label: 'Operations',
        items: [
            { name: 'Inspections', href: '/admin/inspections', icon: 'checklist', module: 'operations' },
            { name: 'Documents', href: '/admin/documents', icon: 'folder', module: 'operations' },
            { name: 'Price History', href: '/admin/price-history', icon: 'trending_up', module: 'operations' },
            { name: 'Expenses', href: '/admin/expenses', icon: 'receipt_long', module: 'operations' },
            { name: 'Share Logs', href: '/admin/share-logs', icon: 'share', module: 'operations' },
        ],
    },
    {
        label: 'Finance',
        items: [
            { name: 'Accounts', href: '/admin/accounts', icon: 'account_balance', module: 'finance' },
            { name: 'Commissions', href: '/admin/commissions', icon: 'payments', module: 'finance' },
            { name: 'Tax & GST', href: '/admin/tax', icon: 'receipt', module: 'finance' },
        ],
    },
    {
        label: 'Schedule',
        items: [
            { name: 'Calendar', href: '/admin/calendar', icon: 'calendar_month', module: 'schedule' },
            { name: 'Notifications', href: '/admin/notifications', icon: 'notifications', module: 'schedule' },
            { name: 'Templates', href: '/admin/templates', icon: 'chat', module: 'schedule' },
        ],
    },
    {
        label: 'Partners',
        items: [
            { name: 'Dealer Management', href: '/admin/dealers', icon: 'store', module: 'dealers' },
        ],
    },
    {
        label: 'Admin',
        items: [
            { name: 'Users', href: '/admin/users', icon: 'manage_accounts', module: 'users' },
            { name: 'Audit Logs', href: '/admin/audit-logs', icon: 'history', module: 'audit_logs' },
            { name: 'Feedback', href: '/admin/feedback', icon: 'reviews', module: 'settings' },
            { name: 'Settings', href: '/admin/settings', icon: 'settings', module: 'settings' },
        ],
    },
];

// ─── Task Notifier Component ────────────────────────────────────────────────
const TaskNotifier = () => {
    const { tasks, refreshData } = useData();
    const [activeNotifications, setActiveNotifications] = useState<any[]>([]);
    
    // Use a ref to keep track of tasks we've already notified about in this session
    // This prevents the same task from popping up constantly
    const notifiedIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            
            // Find tasks that are 'todo', have a due date in the past, and haven't been notified yet
            const dueTasks = tasks.filter(t => {
                if (t.status !== 'todo') return false;
                if (notifiedIds.current.has(t.id)) return false;
                
                const dueDate = new Date(t.due_date);
                return dueDate <= now;
            });

            if (dueTasks.length > 0) {
                // Add new due tasks to notifications and mark as notified
                dueTasks.forEach(t => notifiedIds.current.add(t.id));
                setActiveNotifications(prev => [...prev, ...dueTasks]);
            }
        }, 10000); // Check every 10 seconds

        return () => clearInterval(interval);
    }, [tasks]);

    const handleDismiss = (id: string) => {
        setActiveNotifications(prev => prev.filter(t => t.id !== id));
    };

    const handleMarkComplete = async (id: string) => {
        // Optimistically dismiss
        handleDismiss(id);
        
        // Update database
        await supabase.from('tasks').update({ status: 'completed' }).eq('id', id);
        refreshData();
    };

    if (activeNotifications.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
            {activeNotifications.map(task => (
                <div key={task.id} className="pointer-events-auto bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 flex flex-col h-full bg-amber-400"></div>
                    <div className="flex justify-between items-start mb-2 pl-2">
                        <div className="flex items-center gap-2">
                            <div className="size-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                                <span className="material-symbols-outlined text-sm">notifications_active</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Follow-Up Due</p>
                                <p className="text-sm font-bold text-slate-800">{task.title}</p>
                            </div>
                        </div>
                        <button onClick={() => handleDismiss(task.id)} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>
                    {task.description && <p className="text-xs text-slate-500 mb-3 pl-2 line-clamp-2">{task.description}</p>}
                    
                    {task.lead && (
                        <div className="mb-3 pl-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                            <Link to={`/admin/leads/${task.lead_id}`} onClick={() => handleDismiss(task.id)} className="text-xs font-semibold text-primary hover:underline">
                                {task.lead.full_name}
                            </Link>
                        </div>
                    )}
                    
                    <div className="flex gap-2 pl-2 mt-3">
                        <button onClick={() => handleDismiss(task.id)} className="flex-1 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                            Remind Later
                        </button>
                        <button onClick={() => handleMarkComplete(task.id)} className="flex-1 py-1.5 text-xs font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex justify-center items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">check</span> Done
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

// ─── Announcement Banner Component ─────────────────────────────────────────
const AnnouncementBanner = () => {
    const [announcements, setAnnouncements] = React.useState<any[]>([]);
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
        supabase
            .from('staff_announcements')
            .select('*')
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false })
            .then(({ data }) => {
                if (data) {
                    const today = new Date().toDateString();
                    const visible = data.filter(a =>
                        a.is_pinned || new Date(a.created_at).toDateString() === today
                    );
                    setAnnouncements(visible);
                }
            });
    }, []);

    if (announcements.length === 0) return null;

    const urgentCount = announcements.filter(a => a.priority === 'urgent').length;
    const bgClass = urgentCount > 0 ? 'bg-red-500' : 'bg-amber-500';

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className={`hidden sm:flex items-center gap-2 h-9 px-3 ${bgClass} text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shrink-0`}
            >
                <span className="material-symbols-outlined text-sm">campaign</span>
                <span>{announcements.length} Announcement{announcements.length !== 1 ? 's' : ''}</span>
                {urgentCount > 0 && <span className="bg-white text-red-600 text-[10px] font-black px-1.5 py-0.5 rounded-full">{urgentCount}</span>}
            </button>
            {open && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-white">campaign</span>
                                <h2 className="font-black text-white">Announcements</h2>
                            </div>
                            <button onClick={() => setOpen(false)} className="size-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-lg">close</span>
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4 space-y-3">
                            {announcements.map(a => {
                                const colors = a.priority === 'urgent' ? 'bg-red-50 border-red-200' : a.priority === 'celebration' ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-slate-200';
                                return (
                                    <div key={a.id} className={`${colors} border rounded-xl p-4`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            {a.is_pinned && <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">📌 Pinned</span>}
                                            <span className="text-[10px] font-bold uppercase text-slate-500">{a.priority}</span>
                                        </div>
                                        <p className="font-bold text-slate-800">{a.title}</p>
                                        <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{a.body}</p>
                                        <p className="text-[10px] text-slate-400 mt-2">{new Date(a.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const AdminLayout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const location = useLocation();
    const navigate = useNavigate();
    const { profile, signOut, isAdmin, hasPermission } = useAuth();

    // Filter nav groups based on permissions for staff users
    const visibleNavGroups = NAV_GROUPS.map(group => ({
        ...group,
        items: group.items.filter(item =>
            isAdmin || hasPermission(item.module, 'view')
        ),
    })).filter(group => group.items.length > 0);

    const handleLogout = async () => {
        await signOut();
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
        <DataProvider>
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
                            <p className="text-sm font-bold text-primary font-display">Shree Swami Samarth Admin</p>
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
                        {visibleNavGroups.map(group => {
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
                        <div className="hidden sm:flex items-center gap-2 flex-1 max-w-2xl ml-4">
                            <GlobalSearch />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <AnnouncementBanner />
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
                            <div className="size-9 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div className="hidden md:block">
                                <p className="text-sm font-semibold text-primary">{profile?.full_name ?? 'Admin'}</p>
                                <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">Administrator</p>
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
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                    {/* Inject Task Notifier */}
                    <TaskNotifier />
                </main>
            </div>
            </div>
        </DataProvider>
    );
};

export default AdminLayout;
