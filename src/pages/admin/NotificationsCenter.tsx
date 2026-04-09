import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { supabase } from '../../lib/supabase';

const NotificationsCenter = () => {
    const { tasks, leads, refreshData } = useData();
    const [submitting, setSubmitting] = useState(false);

    // Generate notifications natively by isolating Overdue or High priority tasks
    const activeAlerts = tasks
        .filter(t => t.status !== 'completed')
        .map(t => {
            const dueDate = new Date(t.due_date);
            const isOverdue = dueDate < new Date() && dueDate.toDateString() !== new Date().toDateString();
            const leadAssigned = leads.find(l => l.id === t.lead_id);

            return {
                id: t.id,
                title: isOverdue ? 'Overdue Action Required' : t.title,
                desc: isOverdue ? `Task "${t.title}" was due on ${dueDate.toLocaleDateString()}.` : (t.description || 'Pending action.'),
                type: isOverdue ? 'Alert' : 'Task',
                time: isOverdue ? 'Overdue' : 'Due Today',
                read: false,
                color: isOverdue ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600',
                icon: isOverdue ? 'warning' : 'assignment'
            };
        });

    const handleResolve = async (taskId: string) => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: 'completed' })
                .eq('id', taskId);
                
            if (error) throw error;
            await refreshData();
        } catch (err) {
            console.error('Error resolving task:', err);
            alert('Failed to resolve notification.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResolveAll = async () => {
        if (submitting || activeAlerts.length === 0) return;
        setSubmitting(true);
        try {
            const taskIds = activeAlerts.map(a => a.id);
            const { error } = await supabase
                .from('tasks')
                .update({ status: 'completed' })
                .in('id', taskIds);
                
            if (error) throw error;
            await refreshData();
        } catch (err) {
            console.error('Error resolving all tasks:', err);
            alert('Failed to resolve all notifications.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Notification Center</h1>
                    <p className="text-slate-500 text-sm">Actionable system alerts and overdue CRM tasks.</p>
                </div>
                <div className="flex gap-2">
                     <span className="py-2 px-3 text-[10px] font-bold tracking-wider uppercase text-blue-600 bg-blue-100 rounded-lg shadow-sm">LIVE FEED</span>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[var(--shadow-card)]">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-primary font-display text-lg">System Priority Queue</h2>
                    <button 
                        onClick={handleResolveAll}
                        disabled={submitting || activeAlerts.length === 0}
                        className="text-xs font-semibold text-primary hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Resolving...' : 'Mark all as resolved'}
                    </button>
                </div>

                <div className="space-y-3">
                    {activeAlerts.length === 0 && (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-300">
                            <span className="material-symbols-outlined text-4xl mb-3">notifications_paused</span>
                            <p className="text-sm font-medium">You're all caught up! No urgent tasks tracked.</p>
                        </div>
                    )}
                    {activeAlerts.map(n => (
                        <div key={n.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${n.read ? 'bg-slate-50 border-transparent opacity-60' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${n.color}`}>
                                <span className="material-symbols-outlined text-lg">{n.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex justify-between items-start mb-1">
                                    <p className={`text-sm ${n.read ? 'font-semibold text-slate-600' : 'font-black text-primary'}`}>{n.title}</p>
                                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap ml-4">{n.time}</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-2 truncate">{n.desc}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase bg-slate-100 text-slate-500">{n.type}</span>
                                </div>
                            </div>
                            {!n.read && (
                                <button 
                                    onClick={() => handleResolve(n.id)}
                                    disabled={submitting}
                                    className="size-8 flex items-center justify-center text-slate-300 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors shrink-0 disabled:opacity-50" 
                                    title="Mark as resolved"
                                >
                                    <span className="material-symbols-outlined text-sm">check</span>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NotificationsCenter;
