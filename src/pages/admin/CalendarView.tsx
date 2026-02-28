import React, { useState } from 'react';

const EVENTS: Record<string, Array<{ title: string; time: string; type: string }>> = {
    '2024-11-05': [{ title: 'Test Drive — Rajesh Kumar (Creta)', time: '10:30 AM', type: 'test-drive' }],
    '2024-11-07': [{ title: 'Delivery — Honda City to Sanjay P.', time: '11:00 AM', type: 'delivery' }, { title: 'Follow-Up — Amit Joshi', time: '02:00 PM', type: 'follow-up' }],
    '2024-11-10': [{ title: 'Service — Fortuner brake check', time: '09:30 AM', type: 'service' }],
    '2024-11-12': [{ title: 'Test Drive — Priya D. (Fortuner)', time: '10:00 AM', type: 'test-drive' }, { title: 'Follow-Up — Meera Shah', time: '03:30 PM', type: 'follow-up' }],
    '2024-11-15': [{ title: 'Monthly Team Meeting', time: '04:00 PM', type: 'meeting' }],
    '2024-11-18': [{ title: 'Service — Nexon ceramic coating', time: '10:00 AM', type: 'service' }],
    '2024-11-22': [{ title: 'Delivery — Maruti Swift to Deepak K.', time: '11:30 AM', type: 'delivery' }],
    '2024-11-25': [{ title: 'Follow-Up — Ravi Shinde (Seltos)', time: '01:00 PM', type: 'follow-up' }],
};

const typeColors: Record<string, { bg: string; dot: string }> = {
    'test-drive': { bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
    'delivery': { bg: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
    'follow-up': { bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
    'service': { bg: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
    'meeting': { bg: 'bg-slate-50 border-slate-200', dot: 'bg-slate-500' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CalendarView = () => {
    const [year, setYear] = useState(2024);
    const [month, setMonth] = useState(10); // November (0-indexed)
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const getDateKey = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const selectedEvents = selectedDate ? (EVENTS[selectedDate] || []) : [];

    const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-primary font-display">Calendar</h1>
                    <p className="text-slate-500 text-sm">Unified view of test drives, deliveries, services & follow-ups.</p>
                </div>
                <button className="h-10 px-5 bg-accent text-primary font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-accent-hover transition-colors">
                    <span className="material-symbols-outlined text-lg">add</span> Add Event
                </button>
            </div>

            {/* Legend */}
            <div className="flex gap-4">
                {Object.entries(typeColors).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className={`size-2.5 rounded-full ${val.dot}`} />
                        <span className="capitalize">{key.replace('-', ' ')}</span>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Calendar Grid */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[var(--shadow-card)] p-5">
                    <div className="flex items-center justify-between mb-5">
                        <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-xl"><span className="material-symbols-outlined">chevron_left</span></button>
                        <h2 className="font-bold text-primary font-display text-lg">{MONTH_NAMES[month]} {year}</h2>
                        <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-xl"><span className="material-symbols-outlined">chevron_right</span></button>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {DAYS.map(d => <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-2">{d}</div>)}
                        {cells.map((day, i) => {
                            if (day === null) return <div key={`e${i}`} />;
                            const dateKey = getDateKey(day);
                            const events = EVENTS[dateKey] || [];
                            const isSelected = selectedDate === dateKey;
                            return (
                                <button key={i} onClick={() => setSelectedDate(dateKey)} className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all text-sm ${isSelected ? 'bg-primary text-white' : events.length > 0 ? 'bg-slate-50 hover:bg-primary/5 font-medium' : 'hover:bg-slate-50'}`}>
                                    <span className={isSelected ? 'font-bold' : ''}>{day}</span>
                                    {events.length > 0 && (
                                        <div className="flex gap-0.5">
                                            {events.map((e, j) => <span key={j} className={`size-1.5 rounded-full ${isSelected ? 'bg-accent' : typeColors[e.type]?.dot || 'bg-slate-400'}`} />)}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Event Detail */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[var(--shadow-card)]">
                    <h2 className="font-bold text-primary font-display text-sm mb-4">
                        {selectedDate ? new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Select a day'}
                    </h2>
                    {selectedEvents.length > 0 ? (
                        <div className="space-y-3">
                            {selectedEvents.map((e, i) => {
                                const tc = typeColors[e.type];
                                return (
                                    <div key={i} className={`p-3 rounded-xl border ${tc?.bg || 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`size-2 rounded-full ${tc?.dot || 'bg-slate-400'}`} />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{e.type.replace('-', ' ')}</span>
                                        </div>
                                        <p className="text-sm font-semibold text-primary">{e.title}</p>
                                        <p className="text-xs text-slate-500 mt-0.5"><span className="material-symbols-outlined text-xs align-middle mr-0.5">schedule</span>{e.time}</p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-3xl text-slate-300 mb-2">event_busy</span>
                            <p className="text-sm text-slate-400">{selectedDate ? 'No events on this day' : 'Click a date to view events'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
