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
    documents: any[];
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
    const [documents, setDocuments] = useState<any[]>([]);
    const [settings, setSettings] = useState<Record<string, any>>({});
    
    const [loading, setLoading] = useState(true);

    const refreshData = async () => {
        setLoading(true);
        try {
            const safeFetch = async (query: any) => {
                try {
                    const res = await query;
                    return res;
                } catch {
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
                { data: documentsData },
                { data: settingsData }
            ] = await Promise.all([
                safeFetch(supabase.from('leads').select('*').order('created_at', { ascending: false })),
                safeFetch(supabase.from('customers').select('*').order('created_at', { ascending: false })),
                safeFetch(supabase.from('inventory').select('*').order('created_at', { ascending: false })),
                safeFetch(supabase.from('sales').select('*, customer:customers(*), car:inventory(*)').order('sale_date', { ascending: false })),
                safeFetch(supabase.from('bookings').select('*, lead:leads(*), car:inventory(*)').order('booking_date', { ascending: false })),
                safeFetch(supabase.from('lead_activities').select('*').order('created_at', { ascending: false })),
                
                // Keep these failsafe in case the user hasn't run the migration yet, it won't crash the app globally
                safeFetch(supabase.from('tasks').select('*, lead:leads(*)').order('due_date', { ascending: true })),
                safeFetch(supabase.from('follow_ups').select('*, lead:leads(*)').order('next_followup_date', { ascending: true })),
                safeFetch(supabase.from('vehicle_expenses').select('*, car:inventory(*)').order('expense_date', { ascending: false })),
                safeFetch(supabase.from('inspections').select('*, car:inventory(*)').order('inspection_date', { ascending: false })),
                safeFetch(supabase.from('documents').select('*').order('uploaded_at', { ascending: false })),
                safeFetch(supabase.from('dealership_settings').select('*'))
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
            setDocuments(documentsData || []);
            
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
        <DataContext.Provider value={{ leads, customers, inventory, sales, bookings, activities, tasks, followUps, expenses, inspections, documents, settings, loading, refreshData }}>
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
