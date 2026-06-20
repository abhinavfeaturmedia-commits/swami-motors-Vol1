import React, {
    createContext, useContext, useEffect, useRef,
    useState, useCallback
} from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AttendanceRecord {
    id: string;
    user_id: string;
    date: string;
    clock_in: string | null;
    clock_out: string | null;
    status: 'present' | 'absent' | 'half_day' | 'late' | 'on_leave' | 'holiday' | 'weekend';
    total_hours_worked: number;
    total_session_minutes: number;
    break_minutes: number;
    overtime_minutes: number;
    is_late: boolean;
    is_early_departure: boolean;
    admin_note: string | null;
}

export interface AttendanceBreak {
    id: string;
    record_id: string;
    break_start: string;
    break_end: string | null;
    duration_minutes: number | null;
    break_type: 'lunch' | 'short' | 'personal';
}

export interface ShiftConfig {
    id: string;
    name: string;
    department: string | null;
    user_id: string | null;
    start_time: string;    // "09:30:00"
    end_time: string;      // "18:30:00"
    late_threshold: number; // minutes
    half_day_hours: number;
    is_default: boolean;
}

interface AttendanceContextValue {
    todayRecord: AttendanceRecord | null;
    todayBreaks: AttendanceBreak[];
    activeBreak: AttendanceBreak | null;
    sessionId: string | null;
    isClocked: boolean;
    isOnBreak: boolean;
    shift: ShiftConfig | null;
    loading: boolean;
    clockIn: () => Promise<{ error?: string }>;
    clockOut: () => Promise<{ error?: string }>;
    startBreak: (type: AttendanceBreak['break_type']) => Promise<void>;
    endBreak: () => Promise<void>;
    refreshToday: () => Promise<void>;
    /** Total active session minutes accumulated today */
    todaySessionMinutes: number;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AttendanceContext = createContext<AttendanceContextValue>({
    todayRecord: null,
    todayBreaks: [],
    activeBreak: null,
    sessionId: null,
    isClocked: false,
    isOnBreak: false,
    shift: null,
    loading: true,
    clockIn: async () => ({}),
    clockOut: async () => ({}),
    startBreak: async () => {},
    endBreak: async () => {},
    refreshToday: async () => {},
    todaySessionMinutes: 0,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const todayDate = () => new Date().toISOString().split('T')[0];

/** Parse "HH:MM:SS" time string into { hours, minutes } */
const parseTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return { hours: h, minutes: m };
};

/** Returns current date's ISO without time */
const nowISO = () => new Date().toISOString();

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, profile, isAdmin, isStaff } = useAuth();

    const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
    const [todayBreaks, setTodayBreaks] = useState<AttendanceBreak[]>([]);
    const [activeBreak, setActiveBreak] = useState<AttendanceBreak | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [shift, setShift] = useState<ShiftConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [todaySessionMinutes, setTodaySessionMinutes] = useState(0);

    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const sessionStartRef = useRef<Date | null>(null);
    const autoClockInDoneRef = useRef(false); // Prevents double-fire on re-renders

    const isEligible = isAdmin || isStaff;

    // ─── Fetch Shift Config ───────────────────────────────────────────────────

    const fetchShift = useCallback(async () => {
        if (!profile) return;
        // Try user-specific shift first, then department, then default
        const { data } = await supabase
            .from('shift_config')
            .select('*')
            .or(`user_id.eq.${profile.id},is_default.eq.true`)
            .order('user_id', { ascending: false }) // user-specific comes first
            .limit(1);

        if (data && data.length > 0) setShift(data[0] as ShiftConfig);
    }, [profile]);

    // ─── Fetch Today's Record ─────────────────────────────────────────────────

    const refreshToday = useCallback(async () => {
        if (!user || !isEligible) { setLoading(false); return; }

        const today = todayDate();
        const { data: record } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .maybeSingle();

        setTodayRecord(record as AttendanceRecord | null);

        if (record) {
            const { data: breaks } = await supabase
                .from('attendance_breaks')
                .select('*')
                .eq('record_id', record.id)
                .order('break_start', { ascending: true });

            const breakList = (breaks ?? []) as AttendanceBreak[];
            setTodayBreaks(breakList);
            const openBreak = breakList.find(b => !b.break_end);
            setActiveBreak(openBreak ?? null);
        }

        // Fetch today's session total from DB
        if (user) {
            const { data: sessions } = await supabase
                .from('attendance_sessions')
                .select('duration_minutes')
                .eq('user_id', user.id)
                .eq('date', today);

            const totalDB = (sessions ?? []).reduce((s, r) => s + (r.duration_minutes ?? 0), 0);
            // Add live session time
            const liveMins = sessionStartRef.current
                ? Math.floor((Date.now() - sessionStartRef.current.getTime()) / 60000)
                : 0;
            setTodaySessionMinutes(totalDB + liveMins);
        }

        setLoading(false);
    }, [user, isEligible]);

    // ─── Start Attendance Session (on login) ──────────────────────────────────

    const startSession = useCallback(async () => {
        if (!user || !isEligible) return;

        sessionStartRef.current = new Date();
        const today = todayDate();

        const { data } = await supabase
            .from('attendance_sessions')
            .insert({ user_id: user.id, date: today })
            .select()
            .single();

        if (data) setSessionId(data.id);
    }, [user, isEligible]);

    // ─── Heartbeat — every 5 minutes ─────────────────────────────────────────

    const sendHeartbeat = useCallback(async () => {
        if (!sessionId || !sessionStartRef.current) return;

        const duration = Math.floor((Date.now() - sessionStartRef.current.getTime()) / 60000);

        await supabase
            .from('attendance_sessions')
            .update({ last_seen: nowISO(), duration_minutes: duration })
            .eq('id', sessionId);

        // Update total_session_minutes on attendance_record if clocked in
        if (todayRecord) {
            await supabase
                .from('attendance_records')
                .update({ total_session_minutes: duration })
                .eq('id', todayRecord.id);
        }

        // Update local state with total (DB + live)
        const { data: sessions } = await supabase
            .from('attendance_sessions')
            .select('duration_minutes')
            .eq('user_id', user!.id)
            .eq('date', todayDate());

        const totalDB = (sessions ?? []).reduce((s, r) => s + (r.duration_minutes ?? 0), 0);
        setTodaySessionMinutes(totalDB);
    }, [sessionId, todayRecord, user]);

    // ─── End Session (on logout / tab close) ─────────────────────────────────

    const endSession = useCallback(async () => {
        if (!sessionId || !sessionStartRef.current) return;
        const duration = Math.floor((Date.now() - sessionStartRef.current.getTime()) / 60000);
        await supabase
            .from('attendance_sessions')
            .update({ session_end: nowISO(), duration_minutes: duration, is_active: false })
            .eq('id', sessionId);
    }, [sessionId]);

    // ─── Clock In ─────────────────────────────────────────────────────────────

    const clockIn = useCallback(async (): Promise<{ error?: string }> => {
        if (!user || !shift) return { error: 'Not authenticated or shift not loaded.' };
        if (todayRecord?.clock_in) return { error: 'Already clocked in today.' };

        const now = new Date();
        const today = todayDate();

        // Determine if late
        const { hours: sh, minutes: sm } = parseTime(shift.start_time);
        const shiftStartMs = sh * 60 + sm; // minutes from midnight
        const nowMs = now.getHours() * 60 + now.getMinutes();
        const isLate = nowMs > shiftStartMs + shift.late_threshold;
        const status: AttendanceRecord['status'] = isLate ? 'late' : 'present';

        // Get default shift ID
        const shiftId = shift.id;

        const { data, error } = await supabase
            .from('attendance_records')
            .upsert({
                user_id: user.id,
                date: today,
                clock_in: now.toISOString(),
                status,
                is_late: isLate,
                shift_id: shiftId,
            }, { onConflict: 'user_id,date' })
            .select()
            .single();

        if (error) return { error: error.message };
        setTodayRecord(data as AttendanceRecord);

        // Audit log
        try {
            await supabase.from('audit_logs').insert({
                user_id: user.id,
                action: 'Clock In',
                target_type: 'Attendance',
                target_name: today,
                details: `Clocked in at ${now.toLocaleTimeString('en-IN')}${isLate ? ' (Late)' : ''}`,
            });
        } catch { /* non-critical */ }

        return {};
    }, [user, shift, todayRecord]);

    // ─── Clock Out ────────────────────────────────────────────────────────────

    const clockOut = useCallback(async (): Promise<{ error?: string }> => {
        if (!user || !todayRecord) return { error: 'No clock-in record found.' };
        if (todayRecord.clock_out) return { error: 'Already clocked out today.' };
        if (!shift) return { error: 'Shift configuration not loaded.' };

        const now = new Date();
        const clockInTime = new Date(todayRecord.clock_in!);
        const totalMs = now.getTime() - clockInTime.getTime();
        const breakMs = (todayRecord.break_minutes ?? 0) * 60000;
        const workedMs = Math.max(0, totalMs - breakMs);
        const hoursWorked = workedMs / 3600000;

        // Calculate overtime
        const { hours: eh, minutes: em } = parseTime(shift.end_time);
        const shiftEndMs = eh * 60 + em;
        const nowMs = now.getHours() * 60 + now.getMinutes();
        const overtimeMins = Math.max(0, nowMs - shiftEndMs);
        const isEarlyDeparture = nowMs < shiftEndMs - 15;

        // Determine final status
        let status: AttendanceRecord['status'] = todayRecord.status;
        if (hoursWorked < shift.half_day_hours && status !== 'late') {
            status = 'half_day';
        }

        const { error } = await supabase
            .from('attendance_records')
            .update({
                clock_out: now.toISOString(),
                total_hours_worked: Math.round(hoursWorked * 100) / 100,
                overtime_minutes: overtimeMins,
                is_early_departure: isEarlyDeparture,
                status,
            })
            .eq('id', todayRecord.id);

        if (error) return { error: error.message };

        // Close any open break
        if (activeBreak) await endBreak();

        await endSession();
        await refreshToday();

        // Audit log
        try {
            await supabase.from('audit_logs').insert({
                user_id: user.id,
                action: 'Clock Out',
                target_type: 'Attendance',
                target_name: todayDate(),
                details: `Clocked out at ${now.toLocaleTimeString('en-IN')} — ${hoursWorked.toFixed(2)}h worked`,
            });
        } catch { /* non-critical */ }

        return {};
    }, [user, todayRecord, shift, activeBreak, endSession, refreshToday]);

    // ─── Break Management ─────────────────────────────────────────────────────

    const startBreak = useCallback(async (type: AttendanceBreak['break_type']) => {
        if (!todayRecord || activeBreak) return;

        const { data } = await supabase
            .from('attendance_breaks')
            .insert({ record_id: todayRecord.id, user_id: user!.id, break_type: type })
            .select()
            .single();

        if (data) {
            setActiveBreak(data as AttendanceBreak);
            setTodayBreaks(prev => [...prev, data as AttendanceBreak]);
        }
    }, [todayRecord, activeBreak, user]);

    const endBreak = useCallback(async () => {
        if (!activeBreak) return;

        const now = new Date();
        const start = new Date(activeBreak.break_start);
        const durationMins = Math.round((now.getTime() - start.getTime()) / 60000);

        await supabase
            .from('attendance_breaks')
            .update({ break_end: now.toISOString(), duration_minutes: durationMins })
            .eq('id', activeBreak.id);

        // Update break_minutes on the record
        if (todayRecord) {
            const newBreakTotal = (todayRecord.break_minutes ?? 0) + durationMins;
            await supabase
                .from('attendance_records')
                .update({ break_minutes: newBreakTotal })
                .eq('id', todayRecord.id);
        }

        setActiveBreak(null);
        await refreshToday();
    }, [activeBreak, todayRecord, refreshToday]);

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!isEligible || !user) { setLoading(false); return; }

        // Run shift config FIRST so it's available when refreshToday sets loading=false.
        // Auto clock-in depends on both shift and loading being ready simultaneously.
        const init = async () => {
            await fetchShift();    // shift state is set before loading flips
            await refreshToday(); // sets loading=false — triggers auto clock-in effect
            startSession();       // fire-and-forget, doesn't need to block
        };
        init();

        // Heartbeat every 5 minutes
        heartbeatRef.current = setInterval(sendHeartbeat, 5 * 60 * 1000);

        // End session on tab close
        const handleUnload = () => endSession();
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, [user, isEligible]); // eslint-disable-line react-hooks/exhaustive-deps


    // ─── Auto Clock-In on Login ───────────────────────────────────────────────
    // Fires once per session after both shift config and today's record are loaded.
    // Skips weekends, skips if already clocked in today.

    useEffect(() => {
        // Wait for data to be fully loaded
        if (loading || !shift || !isEligible || !user) return;
        // Only fire once per mount (not on every state update)
        if (autoClockInDoneRef.current) return;
        autoClockInDoneRef.current = true;

        // Skip weekends (0 = Sunday, 6 = Saturday)
        const dow = new Date().getDay();
        if (dow === 0 || dow === 6) return;

        // If not already clocked in today — auto clock in
        if (!todayRecord?.clock_in) {
            clockIn();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, shift, isEligible, user]);
    // NOTE: todayRecord and clockIn intentionally excluded —
    // we only want this to fire once after the initial load, not on every record update.

    // ─── Re-register heartbeat when sessionId updates ─────────────────────────
    useEffect(() => {
        if (!sessionId) return;
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        heartbeatRef.current = setInterval(sendHeartbeat, 5 * 60 * 1000);
        return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
    }, [sessionId, sendHeartbeat]);

    // ─── Derived ──────────────────────────────────────────────────────────────

    const isClocked = !!todayRecord?.clock_in && !todayRecord?.clock_out;
    const isOnBreak = !!activeBreak;

    return (
        <AttendanceContext.Provider value={{
            todayRecord,
            todayBreaks,
            activeBreak,
            sessionId,
            isClocked,
            isOnBreak,
            shift,
            loading,
            clockIn,
            clockOut,
            startBreak,
            endBreak,
            refreshToday,
            todaySessionMinutes,
        }}>
            {children}
        </AttendanceContext.Provider>
    );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAttendance = () => useContext(AttendanceContext);
