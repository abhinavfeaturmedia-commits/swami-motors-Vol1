import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const SHORTCUTS = [
    { icon: 'person_add', label: 'New Lead', path: '/admin/leads' },
    { icon: 'request_quote', label: 'Send Quote', path: '/admin/leads' },
    { icon: 'directions_car', label: 'Book Test Drive', path: '/book-test-drive' },
    { icon: 'build', label: 'Service Appt.', path: '/services' },
];

const TASKS = {
    todo: [
        { title: 'Follow-up call with Rajesh Kumar', priority: 'High', due: '10:30 AM', tag: 'Lead' },
        { title: 'Prepare delivery checklist — Amit J.', priority: 'Medium', due: '12:00 PM', tag: 'Delivery' },
        { title: 'Schedule vehicle photography — 3 cars', priority: 'Low', due: '02:00 PM', tag: 'Inventory' },
    ],
    progress: [
        { title: 'RC Transfer — Honda City ZX (Sanjay P.)', priority: 'High', due: 'Ongoing', tag: 'Admin' },
        { title: 'Insurance renewal — Toyota Fortuner stock', priority: 'Medium', due: 'Today', tag: 'Insurance' },
    ],
};

const TEAM = [
    { name: 'Vikram S.', status: 'Available', avatar: 'VS', role: 'Sales' },
    { name: 'Neha J.', status: 'Busy', avatar: 'NJ', role: 'Finance' },
    { name: 'Amit P.', status: 'Available', avatar: 'AP', role: 'Service' },
    { name: 'Priya K.', status: 'On Leave', avatar: 'PK', role: 'Support' },
];

const priorityColors: Record<string, string> = { 'High': 'text-red-600 bg-red-50', 'Medium': 'text-amber-600 bg-amber-50', 'Low': 'text-green-600 bg-green-50' };
const statusColors: Record<string, string> = { 'Available': 'bg-green-400', 'Busy': 'bg-red-400', 'On Leave': 'bg-slate-300' };

const DailyPlanner = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Good Afternoon, Vikas 👋</h1>
                    <p className="text-slate-500 text-sm">Here's your daily overview. Stay on track and close those deals!</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-primary">Friday, Oct 25, 2024</p>
                    <p className="text-xs text-slate-400">Kolhapur Branch</p>
                </div>
            </div>

            {/* Quick Shortcuts */}
            <div className="grid grid-cols-4 gap-4">
                {SHORTCUTS.map(s => (
                    <Link key={s.label} to={s.path} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)] text-center hover:shadow-[var(--shadow-card-hover)] transition-all group">
                        <div className="size-12 rounded-xl bg-primary/5 mx-auto flex items-center justify-center mb-3 group-hover:bg-accent/10 transition-colors">
                            <span className="material-symbols-outlined text-xl text-primary group-hover:text-accent transition-colors">{s.icon}</span>
                        </div>
                        <p className="text-sm font-semibold text-primary">{s.label}</p>
                    </Link>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Tasks */}
                <div className="lg:col-span-2 space-y-6">
                    {/* To Do */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-bold text-primary font-display flex items-center gap-2"><span className="material-symbols-outlined text-accent">checklist</span> To Do ({TASKS.todo.length})</h2>
                            <button className="text-sm font-semibold text-accent hover:underline">+ Add Task</button>
                        </div>
                        <div className="space-y-3">
                            {TASKS.todo.map(task => (
                                <div key={task.title} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/50 transition-colors group">
                                    <div className="size-5 rounded-md border-2 border-slate-300 flex items-center justify-center cursor-pointer group-hover:border-primary transition-colors" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-primary">{task.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${priorityColors[task.priority]}`}>{task.priority}</span>
                                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{task.tag}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-400 font-medium">{task.due}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* In Progress */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                        <h2 className="font-bold text-primary font-display mb-5 flex items-center gap-2"><span className="material-symbols-outlined text-blue-500">pending</span> In Progress ({TASKS.progress.length})</h2>
                        <div className="space-y-3">
                            {TASKS.progress.map(task => (
                                <div key={task.title} className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                    <div className="size-5 rounded-md bg-blue-500 flex items-center justify-center"><span className="material-symbols-outlined text-white text-sm">remove</span></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-primary">{task.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${priorityColors[task.priority]}`}>{task.priority}</span>
                                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{task.tag}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-400 font-medium">{task.due}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-4">
                    {/* Today's Schedule */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                        <h3 className="font-bold text-primary font-display mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-accent">schedule</span> Today's Schedule</h3>
                        <div className="space-y-3">
                            {[
                                { time: '10:00', task: 'Test Drive — Rajesh K.', color: 'border-l-purple-500' },
                                { time: '11:30', task: 'Sales Review Meeting', color: 'border-l-blue-500' },
                                { time: '02:00', task: 'Client Meeting — Priya D.', color: 'border-l-green-500' },
                                { time: '04:30', task: 'Vehicle Delivery — Amit J.', color: 'border-l-amber-500' },
                            ].map(item => (
                                <div key={item.time} className={`flex items-center gap-3 p-3 bg-slate-50 rounded-lg border-l-3 ${item.color}`}>
                                    <span className="text-xs font-bold text-slate-400 w-10">{item.time}</span>
                                    <p className="text-sm font-medium text-primary">{item.task}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sales Team */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                        <h3 className="font-bold text-primary font-display mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-accent">groups</span> Sales Floor</h3>
                        <div className="space-y-3">
                            {TEAM.map(member => (
                                <div key={member.name} className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="size-9 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center text-xs font-bold">{member.avatar}</div>
                                        <span className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-white ${statusColors[member.status]}`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-primary">{member.name}</p>
                                        <p className="text-[10px] text-slate-400 uppercase">{member.role}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${member.status === 'Available' ? 'bg-green-50 text-green-600' : member.status === 'Busy' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'}`}>{member.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Monthly Target */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                        <h3 className="font-bold text-primary font-display mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-accent">flag</span> Monthly Target</h3>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600">34/45 Cars</span><span className="text-sm font-bold text-primary">76%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: '76%' }} /></div>
                        <p className="text-xs text-slate-400 mt-2">₹82L / ₹1.2Cr revenue achieved</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyPlanner;
