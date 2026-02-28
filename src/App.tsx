import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import CarDetails from './pages/CarDetails';
import Auth from './pages/Auth';
import UserDashboard from './pages/UserDashboard';
import Contact from './pages/Contact';
import SellCar from './pages/SellCar';
import Insurance from './pages/Insurance';
import EMICalculator from './pages/EMICalculator';
import FAQ from './pages/FAQ';
import CompareModels from './pages/CompareModels';
import BookTestDrive from './pages/BookTestDrive';
import ServiceBooking from './pages/ServiceBooking';
import NotFound from './pages/NotFound';

// Admin — existing
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLeads from './pages/admin/AdminLeads';
import AdminInventory from './pages/admin/AdminInventory';
import AdminSales from './pages/admin/AdminSales';
import AdminBookings from './pages/admin/AdminBookings';
import InventoryForm from './pages/admin/InventoryForm';
import LeadDetail from './pages/admin/LeadDetail';
import DailyPlanner from './pages/admin/DailyPlanner';
import AdminLogin from './pages/admin/AdminLogin';

// Admin — new pages (Phase 1: Analytics)
import Analytics from './pages/admin/Analytics';
import Reports from './pages/admin/Reports';
import PerformanceScorecard from './pages/admin/PerformanceScorecard';

// Admin — new pages (Phase 2: CRM)
import Customers from './pages/admin/Customers';
import FollowUps from './pages/admin/FollowUps';
import LeadSources from './pages/admin/LeadSources';

// Admin — new pages (Phase 3: Operations)
import VehicleInspection from './pages/admin/VehicleInspection';
import Documents from './pages/admin/Documents';
import PriceHistory from './pages/admin/PriceHistory';
import VehicleExpenses from './pages/admin/VehicleExpenses';

// Admin — new pages (Phase 4: Finance)
import Accounts from './pages/admin/Accounts';
import Commissions from './pages/admin/Commissions';
import TaxCompliance from './pages/admin/TaxCompliance';

// Admin — new pages (Phase 5: Scheduling)
import NotificationsCenter from './pages/admin/NotificationsCenter';
import MessageTemplates from './pages/admin/MessageTemplates';
import CalendarView from './pages/admin/CalendarView';

// Admin — new pages (Phase 6: Administration)
import UserManagement from './pages/admin/UserManagement';
import AuditLogs from './pages/admin/AuditLogs';
import AdminSettings from './pages/admin/AdminSettings';
import FeedbackReviews from './pages/admin/FeedbackReviews';

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<PublicLayout />}>
                    <Route index element={<Home />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="car/:id" element={<CarDetails />} />
                    <Route path="auth" element={<Auth />} />
                    <Route path="dashboard" element={<UserDashboard />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="sell" element={<SellCar />} />
                    <Route path="insurance" element={<Insurance />} />
                    <Route path="finance" element={<EMICalculator />} />
                    <Route path="faq" element={<FAQ />} />
                    <Route path="compare" element={<CompareModels />} />
                    <Route path="book-test-drive" element={<BookTestDrive />} />
                    <Route path="services" element={<ServiceBooking />} />
                    <Route path="*" element={<NotFound />} />
                </Route>

                {/* Admin Login — standalone, no sidebar */}
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* Admin Routes — protected with layout */}
                <Route path="/admin" element={<AdminLayout />}>
                    {/* Main */}
                    <Route index element={<AdminDashboard />} />
                    <Route path="inventory" element={<AdminInventory />} />
                    <Route path="inventory/new" element={<InventoryForm />} />
                    <Route path="leads" element={<AdminLeads />} />
                    <Route path="leads/:id" element={<LeadDetail />} />
                    <Route path="sales" element={<AdminSales />} />
                    <Route path="bookings" element={<AdminBookings />} />
                    <Route path="planner" element={<DailyPlanner />} />

                    {/* Analytics */}
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="performance" element={<PerformanceScorecard />} />

                    {/* CRM */}
                    <Route path="customers" element={<Customers />} />
                    <Route path="follow-ups" element={<FollowUps />} />
                    <Route path="lead-sources" element={<LeadSources />} />

                    {/* Operations */}
                    <Route path="inspections" element={<VehicleInspection />} />
                    <Route path="documents" element={<Documents />} />
                    <Route path="price-history" element={<PriceHistory />} />
                    <Route path="expenses" element={<VehicleExpenses />} />

                    {/* Finance */}
                    <Route path="accounts" element={<Accounts />} />
                    <Route path="commissions" element={<Commissions />} />
                    <Route path="tax" element={<TaxCompliance />} />

                    {/* Schedule */}
                    <Route path="calendar" element={<CalendarView />} />
                    <Route path="notifications" element={<NotificationsCenter />} />
                    <Route path="templates" element={<MessageTemplates />} />

                    {/* Admin */}
                    <Route path="users" element={<UserManagement />} />
                    <Route path="audit-logs" element={<AuditLogs />} />
                    <Route path="feedback" element={<FeedbackReviews />} />
                    <Route path="settings" element={<AdminSettings />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default App;
