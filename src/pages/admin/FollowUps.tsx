import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

const priorityColors: Record<string, string> = { 
    Hot: 'bg-red-100 text-red-700', 
    Warm: 'bg-amber-100 text-amber-700', 
    Cold: 'bg-blue-100 text-blue-700',
    Medium: 'bg-amber-100 text-amber-700'
};
const typeIcons: Record<string, string> = { Call: 'call', WhatsApp: 'chat', Email: 'mail', Visit: 'directions_walk', Task: 'task' };
const TABS = ['All', 'todo', 'completed', 'overdue'];

const FollowUps = () => {
    const { tasks, refreshData } = useData();
    const [tab, setTab] = useState('All');
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [taskForm, setTaskForm] = useState({ title: '', due_date: '', priority: 'Medium', description: '' });

    // Process live tasks
    const now = new Date();
    const processedTasks = tasks.map(t => {
        const dueDate = new Date(t.due_date);
        const overdue = t.status !== 'completed' && dueDate < now;
        return {
            ...t,
            isOverdue: overdue,
            derivedStatus: overdue && t.status !== 'completed' ? 'overdue' : t.status
        };
    });

    const filtered = tab === 'All' 
        ? processedTasks 
        : processedTasks.filter(f => f.derivedStatus === tab);

    const pendingCount = processedTasks.filter(f => f.status === 'todo' && !f.isOverdue).length;
    const overdueCount = processedTasks.filter(f => f.isOverdue).length;
    const completedCount = processedTasks.filter(f => f.status === 'completed').length;

    const handleMarkComplete = async (id: string) => {
        await supabase.from('tasks').update({ status: 'completed' }).eq('id', id);
        refreshData();
    };

    const handleCreateGlobalTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!taskForm.title || !taskForm.due_date) return;

        const { error } = await supabase.from('tasks').insert({
            title: taskForm.title,
            description: taskForm.description || null,
            due_date: new Date(taskForm.due_date).toISOString(),
            priority: taskForm.priority,
            status: 'todo',
            lead_id: null // Explicitly global/unattached
        });

        if (!error) {
            setTaskForm({ title: '', due_date: '', priority: 'Medium', description: '' });
            setIsCreatingTask(false);
            refreshData();
        } else {
            console.error(error);
            alert("Failed to create global task");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Follow-Up Manager</h1>
                    <p className="text-slate-500 text-sm">Task operations · {pendingCount} pending · {overdueCount} overdue</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button title="Added from Lead Profiles" className="h-10 px-5 bg-accent text-primary font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-accent-hover transition-colors opacity-50 cursor-not-allowed">
                        <span className="material-symbols-outlined text-lg">info</span> Auto-Generated via CRM
                    </button>
                    <button onClick={() => setIsCreatingTask(true)} className="h-10 px-5 bg-primary text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-primary-light transition-colors shadow-sm">
                        <span className="material-symbols-outlined text-lg">add_task</span> Add Global Task
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Total Tasks', val: tasks.length, icon: 'event', color: 'bg-blue-500/10 text-blue-600' },
                    { label: 'Pending', val: pendingCount, icon: 'pending', color: 'bg-amber-500/10 text-amber-600' },
                    { label: 'Completed', val: completedCount, icon: 'check_circle', color: 'bg-green-500/10 text-green-600' },
                    { label: 'Overdue', val: overdueCount, icon: 'warning', color: 'bg-red-500/10 text-red-600' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[var(--shadow-card)]">
                        <div className={`size-9 rounded-xl flex items-center justify-center ${s.color} mb-2`}><span className="material-symbols-outlined text-lg">{s.icon}</span></div>
                        <p className="text-xl font-black text-primary font-display">{s.val}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200">
                {TABS.map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-5 py-3 text-sm font-medium border-b-2 transition-all capitalize ${tab === t ? 'text-primary border-primary font-bold' : 'text-slate-500 border-transparent hover:text-primary'}`}>
                        {t} <span className="text-xs text-slate-400 ml-1">
                            ({t === 'All' ? processedTasks.length : processedTasks.filter(f => f.derivedStatus === t).length})
                        </span>
                    </button>
                ))}
            </div>

            {/* Follow-up Cards */}
            <div className="space-y-3">
                {filtered.length === 0 && (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 border-dashed text-slate-500">
                        No tasks found in this category.
                    </div>
                )}
                {filtered.map(f => (
                    <div key={f.id} className={`bg-white rounded-2xl border p-4 shadow-[var(--shadow-card)] flex items-center gap-4 ${f.isOverdue ? 'border-red-200 bg-red-50/30' : 'border-slate-100'}`}>
                        <div className="size-10 rounded-full bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {f.lead?.full_name?.charAt(0).toUpperCase() || 'T'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <Link to={`/admin/leads/${f.lead_id}`} className="text-sm font-bold text-primary hover:underline">{f.lead?.full_name || 'General Task'}</Link>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${priorityColors[f.priority] || 'bg-slate-100 text-slate-600'}`}>{f.priority || 'Normal'}</span>
                                {f.isOverdue && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">OVERDUE</span>}
                            </div>
                            <p className="text-xs text-slate-500 font-medium">{f.title}</p>
                            {f.description && <p className="text-xs text-slate-400 truncate mt-0.5">{f.description}</p>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                            <span className="material-symbols-outlined text-base">{typeIcons['Task']}</span>
                            <span className="text-slate-300">·</span>
                            <span>{new Date(f.due_date).toLocaleString('en-IN', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="flex gap-1 shrink-0 ml-4">
                            {f.status !== 'completed' && (
                                <button onClick={() => handleMarkComplete(f.id)} className="p-2 hover:bg-green-50 rounded-xl transition-colors group" title="Mark Done">
                                    <span className="material-symbols-outlined text-green-500 group-hover:text-green-600">check_circle</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Global Task Modal */}
            {isCreatingTask && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h2 className="text-xl font-bold text-primary font-display">New Global Task</h2>
                                <p className="text-xs text-slate-500">Create an operational task not tied to a specific lead.</p>
                            </div>
                            <button onClick={() => setIsCreatingTask(false)} className="size-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateGlobalTask} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Task Title <span className="text-red-400">*</span></label>
                                <input required type="text" placeholder="e.g. Call Bank for Auto Loan Updates" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-shadow" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Due Date <span className="text-red-400">*</span></label>
                                    <input required type="datetime-local" value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-shadow" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Priority</label>
                                    <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-shadow bg-white">
                                        <option value="Hot">High / Urgent</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Cold">Low / Planning</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Description <span className="text-xs text-slate-400 font-normal">(optional)</span></label>
                                <textarea placeholder="Add any details, instructions, or notes..." value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} rows={3} className="w-full border border-slate-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-shadow"></textarea>
                            </div>
                            
                            <div className="pt-2">
                                <button type="submit" className="w-full h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-light transition-colors shadow-sm flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-lg">add_task</span> Save Global Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FollowUps;
