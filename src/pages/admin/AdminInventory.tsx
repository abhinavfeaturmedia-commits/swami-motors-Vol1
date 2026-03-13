import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const CARS = [
    { id: '1', name: '2021 Hyundai Creta SX', price: '₹14.50L', fuel: 'Petrol', trans: 'Automatic', km: '24,000', status: 'Available', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZ9on2reKfaAeW52as0W9TitvVermkqQOTGwGUHGFM5bCQDPr3JQomAy3uKn2C9ta7SmSbrSUUJaxiGih2jDZhMfUpbTcKnZJ-RPJfNxEUS-EZ4nJ-sPFU6kBj2kUZGbL-r5IVAcPmDncOyoqNZbQSpH02EOyXXaZyH82dIaNWIXphtUdSIznx3bz3r3EVA2OCr8aT-X0PqsVL_QOdO5KMvyuQnYom1A1lLdlS20IRmgRzl2v7BYVRIjr_2c4thS8RPJ5yrqGxXQZ_' },
    { id: '2', name: '2020 Honda City ZX', price: '₹11.25L', fuel: 'Diesel', trans: 'Manual', km: '45,000', status: 'Reserved', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaKaKnGbHYFJCDX_cjtEoTnOXSXRK1uOJAuY6xFM7kHp1lRjh4SrbIY13EtB-lwh_114ezqDBbNp5k2MOvbj_PNfwJjMA1w8u_fpQBxshaORXq2tfnEb1wSb7IgJcccWGiTcxGrHqjKxC1gRJADNvYzyCMnomGUynio4g4v59OhKtWfnneo_bWxmB6w4I_K-C3b35seWjirJAHTfQPNvbuys4WYUgrG9v6VQTl4drFcuU4qZnN88NmIXTdpXCdgnADTxWjYRYJuEfR' },
    { id: '3', name: '2022 Tata Nexon XZ+', price: '₹9.85L', fuel: 'Petrol', trans: 'Automatic', km: '12,500', status: 'Available', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZ9on2reKfaAeW52as0W9TitvVermkqQOTGwGUHGFM5bCQDPr3JQomAy3uKn2C9ta7SmSbrSUUJaxiGih2jDZhMfUpbTcKnZJ-RPJfNxEUS-EZ4nJ-sPFU6kBj2kUZGbL-r5IVAcPmDncOyoqNZbQSpH02EOyXXaZyH82dIaNWIXphtUdSIznx3bz3r3EVA2OCr8aT-X0PqsVL_QOdO5KMvyuQnYom1A1lLdlS20IRmgRzl2v7BYVRIjr_2c4thS8RPJ5yrqGxXQZ_' },
    { id: '4', name: '2023 Maruti Swift LXI', price: '₹6.25L', fuel: 'Petrol', trans: 'Manual', km: '8,200', status: 'Sold', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaKaKnGbHYFJCDX_cjtEoTnOXSXRK1uOJAuY6xFM7kHp1lRjh4SrbIY13EtB-lwh_114ezqDBbNp5k2MOvbj_PNfwJjMA1w8u_fpQBxshaORXq2tfnEb1wSb7IgJcccWGiTcxGrHqjKxC1gRJADNvYzyCMnomGUynio4g4v59OhKtWfnneo_bWxmB6w4I_K-C3b35seWjirJAHTfQPNvbuys4WYUgrG9v6VQTl4drFcuU4qZnN88NmIXTdpXCdgnADTxWjYRYJuEfR' },
    { id: '5', name: '2021 Toyota Fortuner', price: '₹32.00L', fuel: 'Diesel', trans: 'Automatic', km: '38,000', status: 'Available', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZ9on2reKfaAeW52as0W9TitvVermkqQOTGwGUHGFM5bCQDPr3JQomAy3uKn2C9ta7SmSbrSUUJaxiGih2jDZhMfUpbTcKnZJ-RPJfNxEUS-EZ4nJ-sPFU6kBj2kUZGbL-r5IVAcPmDncOyoqNZbQSpH02EOyXXaZyH82dIaNWIXphtUdSIznx3bz3r3EVA2OCr8aT-X0PqsVL_QOdO5KMvyuQnYom1A1lLdlS20IRmgRzl2v7BYVRIjr_2c4thS8RPJ5yrqGxXQZ_' },
];

const statusColors: Record<string, string> = { 'Available': 'bg-green-100 text-green-700', 'Reserved': 'bg-amber-100 text-amber-700', 'Sold': 'bg-slate-200 text-slate-600' };
const tabs = ['All Cars', 'Available', 'Reserved', 'Sold'];

const AdminInventory = () => {
    const [activeTab, setActiveTab] = useState('All Cars');
    const filtered = activeTab === 'All Cars' ? CARS : CARS.filter(c => c.status === activeTab);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Inventory Management</h1>
                    <p className="text-slate-500 text-sm">{CARS.length} vehicles in stock · {CARS.filter(c => c.status === 'Available').length} available</p>
                </div>
                <Link to="/admin/inventory/new" className="h-10 px-5 bg-accent text-primary font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-accent-hover transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-lg">add</span> Add New Car
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200">
                {tabs.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === tab ? 'text-primary border-primary font-bold' : 'text-slate-500 border-transparent hover:text-primary'}`}>
                        {tab} <span className="text-xs text-slate-400 ml-1">({tab === 'All Cars' ? CARS.length : CARS.filter(c => c.status === tab).length})</span>
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] overflow-x-auto">
                <table className="w-full min-w-[700px]">
                    <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                            <th className="text-left px-5 py-3">Vehicle</th>
                            <th className="text-left px-5 py-3">Price</th>
                            <th className="text-left px-5 py-3">Details</th>
                            <th className="text-left px-5 py-3">Mileage</th>
                            <th className="text-left px-5 py-3">Status</th>
                            <th className="text-left px-5 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(car => (
                            <tr key={car.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="size-12 rounded-xl overflow-hidden bg-slate-100 shrink-0"><img src={car.img} alt={car.name} className="w-full h-full object-cover" /></div>
                                        <span className="text-sm font-semibold text-primary">{car.name}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5 text-sm font-bold text-primary">{car.price}</td>
                                <td className="px-5 py-3.5 text-sm text-slate-500">{car.fuel} · {car.trans}</td>
                                <td className="px-5 py-3.5 text-sm text-slate-500">{car.km}</td>
                                <td className="px-5 py-3.5"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${statusColors[car.status]}`}>{car.status}</span></td>
                                <td className="px-5 py-3.5">
                                    <div className="flex gap-1">
                                        <button className="p-1.5 hover:bg-slate-100 rounded-lg" title="Edit"><span className="material-symbols-outlined text-slate-400 text-lg">edit</span></button>
                                        <button className="p-1.5 hover:bg-slate-100 rounded-lg" title="View"><span className="material-symbols-outlined text-slate-400 text-lg">visibility</span></button>
                                        <button className="p-1.5 hover:bg-red-50 rounded-lg" title="Delete"><span className="material-symbols-outlined text-red-400 text-lg">delete</span></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminInventory;
