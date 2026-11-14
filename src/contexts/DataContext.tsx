import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface DataContextType {
    leads: any[];
    customers: any[];
    inventory: any[];
    sales: any[];
    bookings: any[];
    activities: any[];
    tasks: any[];
    followUps: any[];
    expenses: any[];
    inspections: any[];
    visits: any[];
    clubMembers: any[];
    clubTransactions: any[];
    clubs: any[];
    chapters: any[];
    clubAttendance: any[];
    clubPresentations: any[];
    clubOneToOne: any[];
    clubOneToMany: any[];
    clubReferrals: any[];
    clubBusinessDeals: any[];
    clubGifts: any[];
    financeServices: any[];
    settings: Record<string, any>;
    loading: boolean;
    refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [leads, setLeads] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);
    const [sales, setSales] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    
    // New V2 Modules
    const [tasks, setTasks] = useState<any[]>([]);
    const [followUps, setFollowUps] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [inspections, setInspections] = useState<any[]>([]);
    const [visits, setVisits] = useState<any[]>([]);
    const [clubMembers, setClubMembers] = useState<any[]>([]);
    const [clubTransactions, setClubTransactions] = useState<any[]>([]);
    const [clubs, setClubs] = useState<any[]>([]);
    const [chapters, setChapters] = useState<any[]>([]);
    const [clubAttendance, setClubAttendance] = useState<any[]>([]);
    const [clubPresentations, setClubPresentations] = useState<any[]>([]);
    const [clubOneToOne, setClubOneToOne] = useState<any[]>([]);
    const [clubOneToMany, setClubOneToMany] = useState<any[]>([]);
    const [clubReferrals, setClubReferrals] = useState<any[]>([]);
    const [clubBusinessDeals, setClubBusinessDeals] = useState<any[]>([]);
    const [clubGifts, setClubGifts] = useState<any[]>([]);
    const [financeServices, setFinanceServices] = useState<any[]>([]);
    const [settings, setSettings] = useState<Record<string, any>>({});
    
    const [loading, setLoading] = useState(true);

    const refreshData = async () => {
        setLoading(true);
        try {
            const safeFetch = async (query: any) => {
                try {
                    const { data, error } = await query;
                    if (error) {
                        console.warn("safeFetch query warning:", error);
                        return { data: [] };
                    }
                    return { data: data || [] };
                } catch (error) {
                    console.error("Error in safeFetch:", error);
                    return { data: [] };
                }
            };

            const [
                { data: leadsData },
                { data: customersData },
                { data: inventoryData },
                { data: salesData },
                { data: bookingsData },
                { data: activitiesData },
                { data: tasksData },
                { data: followUpsData },
                { data: expensesData },
                { data: inspectionsData },
                { data: visitsData },
                { data: settingsData },
                { data: clubMembersData },
                { data: clubTransactionsData },
                { data: financeServicesData },
                { data: clubsData },
                { data: chaptersData },
                { data: attendanceData },
                { data: presentationsData },
                { data: oneToOneData },
                { data: oneToManyData },
                { data: referralsData },
                { data: businessDealsData },
                { data: giftsData }
            ] = await Promise.all([
                safeFetch(supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(250)),
                safeFetch(supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(300)),
                safeFetch(supabase.from('inventory').select('*').order('created_at', { ascending: false }).limit(500)),
                safeFetch(supabase.from('sales').select('*, customer:customers(*), car:inventory(*)').order('sale_date', { ascending: false }).limit(300)),
                safeFetch(supabase.from('bookings').select('*, lead:leads(*), car:inventory(*)').order('booking_date', { ascending: false }).limit(300)),
                safeFetch(supabase.from('lead_activities').select('*').order('created_at', { ascending: false }).limit(200)),
                
                // Keep these failsafe in case the user hasn't run the migration yet, it won't crash the app globally
                safeFetch(supabase.from('tasks').select('*, lead:leads(*)').order('due_date', { ascending: true }).limit(200)),
                safeFetch(supabase.from('follow_ups').select('*, lead:leads(*)').order('next_followup_date', { ascending: true }).limit(200)),
                safeFetch(supabase.from('vehicle_expenses').select('*, car:inventory(*)').order('expense_date', { ascending: false }).limit(200)),
                safeFetch(supabase.from('inspections').select('*, car:inventory(*)').order('inspection_date', { ascending: false }).limit(100)),
                safeFetch(supabase.from('visits').select('*, staff:profiles!staff_id(full_name), lead:leads(*), customer:customers(*)').order('created_at', { ascending: false }).limit(200)),
                safeFetch(supabase.from('dealership_settings').select('*')),
                safeFetch(supabase.from('club_members').select('*, customer:customers(*)').order('created_at', { ascending: false }).limit(200)),
                safeFetch(supabase.from('club_service_exchanges').select('*, added_by_profile:profiles!added_by(full_name)').order('transaction_date', { ascending: false }).limit(100)),
                safeFetch(supabase.from('finance_services').select('*, customer:customers(*), car:inventory(*)').order('created_at', { ascending: false }).limit(100)),
                safeFetch(supabase.from('networking_clubs').select('*').order('name', { ascending: true })),
                safeFetch(supabase.from('club_chapters').select('*').order('name', { ascending: true })),
                safeFetch(supabase.from('club_attendance').select('*').order('meeting_date', { ascending: false }).limit(100)),
                safeFetch(supabase.from('club_presentations').select('*').order('presentation_date', { ascending: false }).limit(100)),
                safeFetch(supabase.from('club_one_to_one').select('*').order('meeting_date', { ascending: false }).limit(100)),
                safeFetch(supabase.from('club_one_to_many').select('*').order('meeting_date', { ascending: false }).limit(100)),
                safeFetch(supabase.from('club_referrals').select('*').order('referral_date', { ascending: false }).limit(100)),
                safeFetch(supabase.from('club_business_deals').select('*').order('deal_date', { ascending: false }).limit(100)),
                safeFetch(supabase.from('club_gifts').select('*').order('gift_date', { ascending: false }).limit(100))
            ]);

            setLeads(leadsData || []);
            setCustomers(customersData || []);
            setInventory(inventoryData || []);
            setSales(salesData || []);
            setBookings(bookingsData || []);
            setActivities(activitiesData || []);
            
            setTasks(tasksData || []);
            setFollowUps(followUpsData || []);
            setExpenses(expensesData || []);
            setInspections(inspectionsData || []);
            setVisits(visitsData || []);
            setClubMembers(clubMembersData || []);
            setClubTransactions(clubTransactionsData || []);
            setFinanceServices(financeServicesData || []);
            setClubs(clubsData || []);
            setChapters(chaptersData || []);
            setClubAttendance(attendanceData || []);
            setClubPresentations(presentationsData || []);
            setClubOneToOne(oneToOneData || []);
            setClubOneToMany(oneToManyData || []);
            setClubReferrals(referralsData || []);
            setClubBusinessDeals(businessDealsData || []);
            setClubGifts(giftsData || []);
            
            // Format settings from array of K/V to standard object
            // Supports both column naming conventions (setting_key/setting_value from v2, key/value from v1)
            if (settingsData && settingsData.length > 0) {
                const map: Record<string, any> = {};
                settingsData.forEach((s: any) => {
                    const k = s.setting_key ?? s.key;
                    const v = s.setting_value ?? s.value;
                    if (k !== undefined) map[k] = v;
                });
                setSettings(map);
            }
            
        } catch (error) {
            console.error("Error fetching global data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    return (
        <DataContext.Provider value={{ 
            leads, customers, inventory, sales, bookings, activities, tasks, followUps, expenses, inspections, visits, 
            clubMembers, clubTransactions, clubs, chapters, clubAttendance, clubPresentations, clubOneToOne, clubOneToMany, 
            clubReferrals, clubBusinessDeals, clubGifts, financeServices, settings, loading, refreshData 
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
