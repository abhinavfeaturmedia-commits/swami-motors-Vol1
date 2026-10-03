import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { InquiryCartProvider } from './contexts/InquiryCartContext';
import { ToastProvider } from './contexts/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdminRoute, UserRoute, ModuleRoute } from './components/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Lightweight Page Loader for smooth lazy route transitions
const PageLoader = () => (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="size-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Loading...</p>
    </div>
);

// Eagerly loaded public primary pages for instant initial paint
import Home from './pages/Home';
import Inventory from './pages/Inventory';

// Lazy-loaded secondary public pages
const CarDetails = React.lazy(() => import('./pages/CarDetails'));
const Auth = React.lazy(() => import('./pages/Auth'));
const UserDashboard = React.lazy(() => import('./pages/UserDashboard'));
const Contact = React.lazy(() => import('./pages/Contact'));
const SellCar = React.lazy(() => import('./pages/SellCar'));
const Insurance = React.lazy(() => import('./pages/Insurance'));
const EMICalculator = React.lazy(() => import('./pages/EMICalculator'));
const FAQ = React.lazy(() => import('./pages/FAQ'));
const CompareModels = React.lazy(() => import('./pages/CompareModels'));
const BookTestDrive = React.lazy(() => import('./pages/BookTestDrive'));
const ServiceBooking = React.lazy(() => import('./pages/ServiceBooking'));
const About = React.lazy(() => import('./pages/About'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const AccessoryCatalog = React.lazy(() => import('./pages/AccessoryCatalog'));
const SharedCatalog = React.lazy(() => import('./pages/SharedCatalog'));

// Lazy-loaded Admin Pages (isolated code chunks so public visitors never download CRM code)
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminLeads = React.lazy(() => import('./pages/admin/AdminLeads'));
const AdminInventory = React.lazy(() => import('./pages/admin/AdminInventory'));
const AdminSales = React.lazy(() => import('./pages/admin/AdminSales'));
const AdminBookings = React.lazy(() => import('./pages/admin/AdminBookings'));
const InventoryForm = React.lazy(() => import('./pages/admin/InventoryForm'));
const LeadDetail = React.lazy(() => import('./pages/admin/LeadDetail'));
const DailyPlanner = React.lazy(() => import('./pages/admin/DailyPlanner'));
const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin'));

// Admin — Analytics
const Analytics = React.lazy(() => import('./pages/admin/Analytics'));
const Reports = React.lazy(() => import('./pages/admin/Reports'));
const PerformanceScorecard = React.lazy(() => import('./pages/admin/PerformanceScorecard'));
const StaffAccountabilityDashboard = React.lazy(() => import('./pages/admin/StaffAccountabilityDashboard'));

// Admin — CRM
const Customers = React.lazy(() => import('./pages/admin/Customers'));
const FollowUps = React.lazy(() => import('./pages/admin/FollowUps'));
const Visits = React.lazy(() => import('./pages/admin/Visits'));
const LeadSources = React.lazy(() => import('./pages/admin/LeadSources'));
const ClubMembers = React.lazy(() => import('./pages/admin/ClubMembers'));

// Admin — Operations
const VehicleInspection = React.lazy(() => import('./pages/admin/VehicleInspection'));
const PriceHistory = React.lazy(() => import('./pages/admin/PriceHistory'));
const VehicleExpenses = React.lazy(() => import('./pages/admin/VehicleExpenses'));
const ShareLogs = React.lazy(() => import('./pages/admin/ShareLogs'));
const SharedCatalogsAdmin = React.lazy(() => import('./pages/admin/SharedCatalogsAdmin'));
const ConsignmentTracker = React.lazy(() => import('./pages/admin/ConsignmentTracker'));

// Admin — Finance
const Accounts = React.lazy(() => import('./pages/admin/Accounts'));
const Commissions = React.lazy(() => import('./pages/admin/Commissions'));
const TaxCompliance = React.lazy(() => import('./pages/admin/TaxCompliance'));
const FinanceServices = React.lazy(() => import('./pages/admin/FinanceServices'));

// Admin — Schedule
const NotificationsCenter = React.lazy(() => import('./pages/admin/NotificationsCenter'));
const MessageTemplates = React.lazy(() => import('./pages/admin/MessageTemplates'));
const CalendarView = React.lazy(() => import('./pages/admin/CalendarView'));

// Admin — Administration
const UserManagement = React.lazy(() => import('./pages/admin/UserManagement'));
const AuditLogs = React.lazy(() => import('./pages/admin/AuditLogs'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));

// Admin — Partners
const DealerManagement = React.lazy(() => import('./pages/admin/DealerManagement'));

// Admin — Incentives
const Incentives = React.lazy(() => import('./pages/admin/Incentives'));
const StaffIncentivesView = React.lazy(() => import('./pages/admin/StaffIncentivesView'));

// Admin — Attendance
const Attendance = React.lazy(() => import('./pages/admin/Attendance'));

const App: React.FC = () => {
    return (
        <ErrorBoundary fallbackTitle="Swami Motors System">
            <ToastProvider>
                <AuthProvider>
                    <InquiryCartProvider>
                        <BrowserRouter>
                            <Suspense fallback={<PageLoader />}>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<PublicLayout />}>
                                <Route index element={<Home />} />
                                <Route path="inventory" element={<Inventory />} />
                                <Route path="accessories" element={<AccessoryCatalog />} />
                                <Route path="shared-catalog/:id" element={<SharedCatalog />} />
                                <Route path="car/:id" element={<CarDetails />} />
                                <Route path="auth" element={<Auth />} />
                                <Route path="dashboard" element={
                                    <UserRoute><UserDashboard /></UserRoute>
                                } />
                                <Route path="contact" element={<Contact />} />
                                <Route path="sell" element={<SellCar />} />
                                <Route path="insurance" element={<Insurance />} />
                                <Route path="finance" element={<EMICalculator />} />
                                <Route path="faq" element={<FAQ />} />
                                <Route path="compare" element={<CompareModels />} />
                                <Route path="book-test-drive" element={<BookTestDrive />} />
                                <Route path="services" element={<ServiceBooking />} />
                                <Route path="about" element={<About />} />
                            </Route>

                            {/* Admin Login — standalone, no sidebar */}
                            <Route path="/admin/login" element={<AdminLogin />} />

                            {/* Admin Routes — protected with AdminRoute + layout */}
                            <Route path="/admin" element={
                                <AdminRoute><AdminLayout /></AdminRoute>
                            }>
                                {/* Main */}
                                <Route index element={<AdminDashboard />} />
                                <Route path="inventory" element={<ModuleRoute module="inventory"><AdminInventory /></ModuleRoute>} />
                                <Route path="inventory/new" element={<ModuleRoute module="inventory"><InventoryForm /></ModuleRoute>} />
                                <Route path="inventory/:id/edit" element={<ModuleRoute module="inventory"><InventoryForm /></ModuleRoute>} />
                                <Route path="leads" element={<ModuleRoute module="leads"><AdminLeads /></ModuleRoute>} />
                                <Route path="leads/:id" element={<ModuleRoute module="leads"><LeadDetail /></ModuleRoute>} />
                                <Route path="sales" element={<ModuleRoute module="sales"><AdminSales /></ModuleRoute>} />
                                <Route path="bookings" element={<ModuleRoute module="bookings"><AdminBookings /></ModuleRoute>} />
                                <Route path="planner" element={<ModuleRoute module="bookings"><DailyPlanner /></ModuleRoute>} />

                                {/* Analytics */}
                                <Route path="analytics" element={<ModuleRoute module="analytics"><Analytics /></ModuleRoute>} />
                                <Route path="reports" element={<ModuleRoute module="analytics"><Reports /></ModuleRoute>} />
                                <Route path="performance" element={<ModuleRoute module="analytics"><PerformanceScorecard /></ModuleRoute>} />
                                <Route path="accountability" element={<ModuleRoute module="analytics"><StaffAccountabilityDashboard /></ModuleRoute>} />

                                {/* CRM */}
                                <Route path="customers" element={<ModuleRoute module="crm"><Customers /></ModuleRoute>} />
                                <Route path="follow-ups" element={<ModuleRoute module="crm"><FollowUps /></ModuleRoute>} />
                                <Route path="visits" element={<ModuleRoute module="crm"><Visits /></ModuleRoute>} />
                                <Route path="lead-sources" element={<ModuleRoute module="crm"><LeadSources /></ModuleRoute>} />
                                <Route path="club-members" element={<ModuleRoute module="crm"><ClubMembers /></ModuleRoute>} />

                                {/* Operations */}
                                <Route path="inspections" element={<ModuleRoute module="operations"><VehicleInspection /></ModuleRoute>} />
                                <Route path="price-history" element={<ModuleRoute module="operations"><PriceHistory /></ModuleRoute>} />
                                <Route path="expenses" element={<ModuleRoute module="operations"><VehicleExpenses /></ModuleRoute>} />
                                <Route path="share-logs" element={<ModuleRoute module="operations"><ShareLogs /></ModuleRoute>} />
                                <Route path="shared-catalogs" element={<ModuleRoute module="operations"><SharedCatalogsAdmin /></ModuleRoute>} />
                                <Route path="consignments" element={<ModuleRoute module="inventory"><ConsignmentTracker /></ModuleRoute>} />

                                {/* Finance */}
                                <Route path="accounts" element={<ModuleRoute module="finance"><Accounts /></ModuleRoute>} />
                                <Route path="commissions" element={<ModuleRoute module="finance"><Commissions /></ModuleRoute>} />
                                <Route path="tax" element={<ModuleRoute module="finance"><TaxCompliance /></ModuleRoute>} />
                                <Route path="finance-services" element={<ModuleRoute module="finance"><FinanceServices /></ModuleRoute>} />

                                {/* Schedule */}
                                <Route path="calendar" element={<ModuleRoute module="schedule"><CalendarView /></ModuleRoute>} />
                                <Route path="notifications" element={<ModuleRoute module="schedule"><NotificationsCenter /></ModuleRoute>} />
                                <Route path="templates" element={<ModuleRoute module="schedule"><MessageTemplates /></ModuleRoute>} />

                                {/* Partners */}
                                <Route path="dealers" element={<ModuleRoute module="dealers"><DealerManagement /></ModuleRoute>} />

                                {/* Admin */}
                                <Route path="users" element={<ModuleRoute module="users"><UserManagement /></ModuleRoute>} />
                                <Route path="audit-logs" element={<ModuleRoute module="audit_logs"><AuditLogs /></ModuleRoute>} />
                                <Route path="settings" element={<ModuleRoute module="settings"><AdminSettings /></ModuleRoute>} />

                                {/* Incentives */}
                                <Route path="incentives" element={<ModuleRoute module="incentives"><Incentives /></ModuleRoute>} />
                                <Route path="my-incentives" element={<ModuleRoute module="incentives"><StaffIncentivesView /></ModuleRoute>} />

                                {/* Attendance */}
                                <Route path="attendance" element={<ModuleRoute module="attendance"><Attendance /></ModuleRoute>} />
                            </Route>

                            {/* Fallback Route */}
                            <Route element={<PublicLayout />}>
                                <Route path="*" element={<NotFound />} />
                            </Route>
                        </Routes>
                    </Suspense>
                </BrowserRouter>
            </InquiryCartProvider>
        </AuthProvider>
    </ToastProvider>
</ErrorBoundary>
    );
};

export default App;
