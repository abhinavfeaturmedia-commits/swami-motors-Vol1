import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { supabase } from '../../lib/supabase';
import { toWhatsAppUrl, formatCurrency, formatDate } from '../../lib/utils';
import HighlightText from '../../components/ui/HighlightText';

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface ClubMember {
    id: string;
    customer_id: string | null;
    full_name: string;
    phone: string;
    email: string | null;
    membership_no: string;
    status: 'Active' | 'Inactive' | 'Suspended' | 'Expired';
    points: number;
    joining_date: string;
    expiry_date: string | null;
    total_spent: number;
    referred_by: string | null;
    notes: string | null;
    club_id: string | null;
    club_name: string | null;
    chapter_id: string | null;
    chapter_name: string | null;
    business_name: string | null;
    business_type: string | null;
    business_category: string | null;
    business_services: string | null;
    whatsapp_number: string | null;
    alternate_phone: string | null;
    home_address: string | null;
    business_address: string | null;
    created_at: string;
    customer?: {
        full_name: string;
        phone: string;
        email: string | null;
        city: string | null;
    } | null;
}

const emptyMemberForm = {
    customer_id: '',
    full_name: '',
    phone: '',
    email: '',
    membership_no: '',
    status: 'Active' as const,
    joining_date: new Date().toISOString().slice(0, 10),
    expiry_date: '',
    referred_by: '',
    notes: '',
    club_id: '',
    club_name: 'GBN Club',
    chapter_id: '',
    chapter_name: 'Megha Chapter',
    manual_chapter_name: '',
    business_name: '',
    business_type: '',
    business_category: '',
    business_services: '',
    whatsapp_number: '',
    alternate_phone: '',
    home_address: '',
    business_address: '',
};

const ClubMembers: React.FC = () => {
    const { isAdmin, profile } = useAuth();
    const { 
        clubMembers, 
        clubTransactions, 
        clubs,
        chapters,
        clubAttendance,
        clubPresentations,
        clubOneToOne,
        clubOneToMany,
        clubReferrals,
        clubBusinessDeals,
        customers, 
        sales, 
        loading, 
        refreshData 
    } = useData();

    // ─── High-Speed Local Attendance State (0ms Instant Feedback) ─────────────
    const [localAttendance, setLocalAttendance] = useState<any[]>([]);
    useEffect(() => {
        setLocalAttendance(clubAttendance || []);
    }, [clubAttendance]);

    // ─── Multi-Member / Bulk Attendance State ─────────────────────────────────
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [isBulkAttendanceOpen, setIsBulkAttendanceOpen] = useState(false);
    const [bulkMeetingDate, setBulkMeetingDate] = useState(new Date().toISOString().slice(0, 10));
    const [bulkStatus, setBulkStatus] = useState<'Present' | 'Absent' | 'Late' | 'Substitute'>('Present');
    const [bulkChapterFilter, setBulkChapterFilter] = useState('all');
    const [bulkSaving, setBulkSaving] = useState(false);
    const [bulkSuccessMessage, setBulkSuccessMessage] = useState<string | null>(null);

    // ─── Filters & Search ─────────────────────────────────────────────────────
    const [search, setSearch] = useState('');
    const [selectedClub, setSelectedClub] = useState<string>('all');
    const [selectedChapter, setSelectedChapter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [attendanceFilter, setAttendanceFilter] = useState<string>('all');

    // ─── Modal States ─────────────────────────────────────────────────────────
    const [detail, setDetail] = useState<ClubMember | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<
        'overview' | 'attendance' | 'presentations' | 'onetoone' | 'onetomany' | 'referrals' | 'ledger' | 'settings'
    >('overview');
    
    const [isAdding, setIsAdding] = useState(false);
    const [isManagingClubs, setIsManagingClubs] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // ─── Forms State ──────────────────────────────────────────────────────────
    const [addForm, setAddForm] = useState(emptyMemberForm);
    const [isManualChapter, setIsManualChapter] = useState(false);
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    // Edit Member Form
    const [editForm, setEditForm] = useState<any>({});

    // Club / Chapter Management Form
    const [newClubForm, setNewClubForm] = useState({ name: '', code: '', description: '' });
    const [newChapterForm, setNewChapterForm] = useState({ club_name: 'GBN Club', name: '', city: 'Kolhapur', meeting_day: 'Wednesday' });
    const [activeManageTab, setActiveManageTab] = useState<'clubs' | 'chapters'>('clubs');

    // Action forms inside Detail Modal
    const [attendanceForm, setAttendanceForm] = useState({
        meeting_date: new Date().toISOString().slice(0, 10),
        chapter_name: '',
        is_home_chapter: true,
        status: 'Present' as 'Present' | 'Absent' | 'Substitute' | 'Late',
        substitute_name: '',
        notes: '',
    });

    const [presentationForm, setPresentationForm] = useState({
        presentation_date: new Date().toISOString().slice(0, 10),
        topic: '',
        presentation_type: 'Feature' as 'Feature' | '30_Second' | '8_Minute' | 'Showcase' | 'Other',
        chapter_name: '',
        is_cross_chapter: false,
        notes: '',
    });

    const [oneToOneForm, setOneToOneForm] = useState({
        with_member_id: '',
        with_member_name: '',
        meeting_date: new Date().toISOString().slice(0, 10),
        location: '',
        chapter_name: '',
        discussion_topics: '',
        outcomes: '',
    });

    const [oneToManyForm, setOneToManyForm] = useState({
        title: '',
        meeting_date: new Date().toISOString().slice(0, 10),
        location_or_mode: '',
        attendee_ids: [] as string[],
        key_takeaways: '',
    });

    const [oneToManySearch, setOneToManySearch] = useState('');

    const [referralForm, setReferralForm] = useState({
        direction: 'given' as 'given' | 'received',
        partner_member_id: '',
        partner_name: '',
        referral_name: '',
        referral_phone: '',
        referral_type: 'Inside' as 'Inside' | 'Outside' | 'Cross_Chapter',
        status: 'Given' as 'Given' | 'Contacted' | 'In_Progress' | 'Closed_Deal' | 'Lost',
        estimated_value: '',
        notes: '',
    });

    const [businessDealForm, setBusinessDealForm] = useState({
        given_by_member_id: '',
        given_by_name: '',
        amount: '',
        deal_type: 'New_Business' as 'New_Business' | 'Repeat_Business' | 'Tier_3_Referral',
        deal_date: new Date().toISOString().slice(0, 10),
        chapter_name: '',
        notes: '',
    });

    const [txForm, setTxForm] = useState({
        exchange_type: 'taken_from_member' as 'given_to_member' | 'taken_from_member',
        service_name: '',
        equivalent_value: '',
        notes: '',
    });

    // ─── Generate Membership ID ───────────────────────────────────────────────
    const generateMembershipNumber = (clubName: string) => {
        let prefix = 'MB';
        if (clubName.toLowerCase().includes('gbn')) prefix = 'GBN';
        else if (clubName.toLowerCase().includes('sat')) prefix = 'SAT';
        else if (clubName.toLowerCase().includes('bni')) prefix = 'BNI';
        else if (clubName.toLowerCase().includes('rot')) prefix = 'ROT';
        else {
            const words = clubName.trim().split(' ');
            prefix = words.map(w => w[0]).join('').slice(0, 3).toUpperCase() || 'CLB';
        }
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        return `${prefix}-${randomNum}`;
    };

    // Auto-update membership ID when opening add form or changing club
    useEffect(() => {
        if (isAdding) {
            setAddForm(prev => ({
                ...prev,
                membership_no: generateMembershipNumber(prev.club_name || 'GBN Club'),
            }));
        }
    }, [isAdding, addForm.club_name]);

    // ─── Available Chapters by Selected Club ──────────────────────────────────
    const availableChaptersForClub = (clubName: string) => {
        if (!clubName || clubName === 'all') return chapters;
        return chapters.filter(ch => ch.club_name?.toLowerCase() === clubName.toLowerCase());
    };

    const activeClubChapters = useMemo(() => {
        return availableChaptersForClub(addForm.club_name);
    }, [chapters, addForm.club_name]);

    // ─── Filtered Members List ────────────────────────────────────────────────
    const filteredMembers = useMemo(() => {
        const q = search.toLowerCase().trim();
        return clubMembers.filter((m: ClubMember) => {
            // Club filter
            if (selectedClub !== 'all') {
                const memberClub = m.club_name || 'GBN Club';
                if (memberClub.toLowerCase() !== selectedClub.toLowerCase()) return false;
            }

            // Chapter filter
            if (selectedChapter !== 'all') {
                const memberChapter = m.chapter_name || '';
                if (memberChapter.toLowerCase() !== selectedChapter.toLowerCase()) return false;
            }

            // Status filter
            if (statusFilter !== 'all' && m.status !== statusFilter) {
                return false;
            }

            // Attendance filter
            if (attendanceFilter !== 'all') {
                const memberAttCount = localAttendance.filter(a => a.member_id === m.id && a.status === 'Present').length;
                if (attendanceFilter === 'attended_any' && memberAttCount === 0) return false;
                if (attendanceFilter === 'zero_attendance' && memberAttCount > 0) return false;
            }

            // Text search
            if (!q) return true;
            return (
                m.full_name?.toLowerCase().includes(q) ||
                m.phone?.includes(q) ||
                m.membership_no?.toLowerCase().includes(q) ||
                m.business_name?.toLowerCase().includes(q) ||
                m.business_type?.toLowerCase().includes(q) ||
                m.business_category?.toLowerCase().includes(q) ||
                m.business_services?.toLowerCase().includes(q) ||
                m.club_name?.toLowerCase().includes(q) ||
                m.chapter_name?.toLowerCase().includes(q) ||
                m.referred_by?.toLowerCase().includes(q) ||
                m.whatsapp_number?.includes(q) ||
                m.alternate_phone?.includes(q) ||
                m.home_address?.toLowerCase().includes(q) ||
                m.business_address?.toLowerCase().includes(q)
            );
        });
    }, [clubMembers, search, selectedClub, selectedChapter, statusFilter, attendanceFilter, localAttendance]);

    // ─── Statistics Calculation ───────────────────────────────────────────────
    const stats = useMemo(() => {
        const total = clubMembers.length;
        const active = clubMembers.filter((m: ClubMember) => m.status === 'Active').length;
        const totalAttendance = localAttendance.filter(a => a.status === 'Present').length;
        const totalOneToOne = clubOneToOne.length;
        const totalOneToMany = clubOneToMany.length;
        const totalBusinessVolume = clubBusinessDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        return { total, active, totalAttendance, totalOneToOne, totalOneToMany, totalBusinessVolume };
    }, [clubMembers, localAttendance, clubOneToOne, clubOneToMany, clubBusinessDeals]);

    // ─── Quick Member Stats Map ───────────────────────────────────────────────
    const memberMetricsMap = useMemo(() => {
        const map: Record<string, {
            attendanceTotal: number;
            homeAttendance: number;
            crossAttendance: number;
            presentations: number;
            oneToOne: number;
            oneToManyHosted: number;
            oneToManyAttended: number;
            businessVolume: number;
            referralsGiven: number;
            referralsReceived: number;
            servicesTaken: number;
            servicesGiven: number;
            lastAttended: string | null;
        }> = {};

        clubMembers.forEach(m => {
            map[m.id] = {
                attendanceTotal: 0,
                homeAttendance: 0,
                crossAttendance: 0,
                presentations: 0,
                oneToOne: 0,
                oneToManyHosted: 0,
                oneToManyAttended: 0,
                businessVolume: 0,
                referralsGiven: 0,
                referralsReceived: 0,
                servicesTaken: 0,
                servicesGiven: 0,
                lastAttended: null,
            };
        });

        // Attendance
        localAttendance.forEach(a => {
            if (map[a.member_id] && a.status === 'Present') {
                map[a.member_id].attendanceTotal += 1;
                if (a.is_home_chapter) map[a.member_id].homeAttendance += 1;
                else map[a.member_id].crossAttendance += 1;
                if (!map[a.member_id].lastAttended || a.meeting_date > map[a.member_id].lastAttended!) {
                    map[a.member_id].lastAttended = a.meeting_date;
                }
            }
        });

        // Presentations
        clubPresentations.forEach(p => {
            if (map[p.member_id]) map[p.member_id].presentations += 1;
        });

        // 1-to-1
        clubOneToOne.forEach(o => {
            if (map[o.initiator_member_id]) map[o.initiator_member_id].oneToOne += 1;
            if (o.with_member_id && map[o.with_member_id]) map[o.with_member_id].oneToOne += 1;
        });

        // 1-to-Many
        clubOneToMany.forEach(om => {
            if (map[om.host_member_id]) map[om.host_member_id].oneToManyHosted += 1;
            if (Array.isArray(om.attendee_ids)) {
                om.attendee_ids.forEach((attId: string) => {
                    if (map[attId]) map[attId].oneToManyAttended += 1;
                });
            }
        });

        // Business volume
        clubBusinessDeals.forEach(b => {
            if (map[b.member_id]) map[b.member_id].businessVolume += (Number(b.amount) || 0);
        });

        // Referrals
        clubReferrals.forEach(r => {
            if (r.giver_member_id && map[r.giver_member_id]) map[r.giver_member_id].referralsGiven += 1;
            if (r.receiver_member_id && map[r.receiver_member_id]) map[r.receiver_member_id].referralsReceived += 1;
        });

        // Service exchanges
        clubTransactions.forEach(tx => {
            if (map[tx.member_id]) {
                if (tx.exchange_type === 'taken_from_member') map[tx.member_id].servicesTaken += 1;
                if (tx.exchange_type === 'given_to_member') map[tx.member_id].servicesGiven += 1;
            }
        });

        return map;
    }, [clubMembers, localAttendance, clubPresentations, clubOneToOne, clubOneToMany, clubBusinessDeals, clubReferrals, clubTransactions]);

    // ─── Customer Selection Logic (Link existing Customer) ────────────────────
    const matchedCustomers = useMemo(() => {
        const query = customerSearchQuery.toLowerCase().trim();
        if (!query) return [];
        return customers.filter(c => 
            c.full_name?.toLowerCase().includes(query) || 
            c.phone?.includes(query)
        ).slice(0, 5);
    }, [customers, customerSearchQuery]);

    const handleSelectCustomer = (c: any) => {
        setAddForm(prev => ({
            ...prev,
            customer_id: c.id,
            full_name: c.full_name || '',
            phone: c.phone || '',
            email: c.email || '',
            whatsapp_number: c.whatsapp_number || '',
            alternate_phone: c.alternate_phone || '',
            home_address: c.address || '',
            business_address: c.office_address || '',
            notes: c.notes || '',
        }));
        setCustomerSearchQuery(c.full_name);
        setShowCustomerDropdown(false);
    };

    const handleClearCustomerLink = () => {
        setAddForm(prev => ({
            ...prev,
            customer_id: '',
            full_name: '',
            phone: '',
            email: '',
            whatsapp_number: '',
            alternate_phone: '',
            home_address: '',
            business_address: '',
            notes: '',
        }));
        setCustomerSearchQuery('');
    };

    // ─── Open Detail Modal ────────────────────────────────────────────────────
    const handleOpenDetail = (member: ClubMember) => {
        setDetail(member);
        setActiveDetailTab('overview');
        setEditForm({
            full_name: member.full_name,
            phone: member.phone,
            email: member.email || '',
            status: member.status,
            club_name: member.club_name || 'GBN Club',
            chapter_name: member.chapter_name || 'Megha Chapter',
            expiry_date: member.expiry_date || '',
            referred_by: member.referred_by || '',
            notes: member.notes || '',
            business_name: member.business_name || '',
            business_type: member.business_type || '',
            business_category: member.business_category || '',
            business_services: member.business_services || '',
            whatsapp_number: member.whatsapp_number || '',
            alternate_phone: member.alternate_phone || '',
            home_address: member.home_address || '',
            business_address: member.business_address || '',
        });

        // Initialize sub-forms with member's chapter
        const chName = member.chapter_name || 'General';
        setAttendanceForm(prev => ({ ...prev, chapter_name: chName, is_home_chapter: true }));
        setPresentationForm(prev => ({ ...prev, chapter_name: chName, is_cross_chapter: false }));
        setOneToOneForm(prev => ({ ...prev, chapter_name: chName }));
        setBusinessDealForm(prev => ({ ...prev, chapter_name: chName }));
    };

    // ─── Instant Quick Attendance Toggle (0ms Optimistic Update) ─────────────
    const handleQuickAttendanceToggle = async (e: React.MouseEvent, member: ClubMember) => {
        e.stopPropagation();
        const today = new Date().toISOString().slice(0, 10);
        const existing = localAttendance.find(a => a.member_id === member.id && a.meeting_date === today);

        // Snapshot state for rollback on error
        const prevAttendance = [...localAttendance];

        if (existing) {
            // Optimistically remove immediately (circle clears in 0ms)
            setLocalAttendance(prev => prev.filter(a => a.id !== existing.id && !(a.member_id === member.id && a.meeting_date === today)));

            try {
                const { error } = await supabase.from('club_attendance').delete().eq('id', existing.id);
                if (error) throw error;
            } catch (err: any) {
                console.error('Quick attendance delete error:', err);
                setLocalAttendance(prevAttendance);
                alert('Failed to update attendance: ' + (err.message || err));
            }
        } else {
            // Optimistically add immediately (circle turns green in 0ms)
            const tempId = 'temp-' + Date.now();
            const newRecord = {
                id: tempId,
                member_id: member.id,
                meeting_date: today,
                club_name: member.club_name || 'GBN Club',
                chapter_name: member.chapter_name || 'Megha Chapter',
                is_home_chapter: true,
                status: 'Present',
                marked_by: profile?.id || null,
            };
            setLocalAttendance(prev => [newRecord, ...prev]);

            try {
                const { data, error } = await supabase.from('club_attendance').insert({
                    member_id: member.id,
                    meeting_date: today,
                    club_name: member.club_name || 'GBN Club',
                    chapter_name: member.chapter_name || 'Megha Chapter',
                    is_home_chapter: true,
                    status: 'Present',
                    marked_by: profile?.id || null,
                }).select().single();

                if (error) throw error;
                if (data) {
                    setLocalAttendance(prev => prev.map(a => a.id === tempId ? data : a));
                }
            } catch (err: any) {
                console.error('Quick attendance insert error:', err);
                setLocalAttendance(prevAttendance);
                alert('Failed to update attendance: ' + (err.message || err));
            }
        }
    };

    // ─── Multi-Member / Bulk Attendance Handlers ──────────────────────────────
    const handleBulkAttendanceSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (selectedMemberIds.length === 0) {
            alert('Please select at least one member.');
            return;
        }

        setBulkSaving(true);
        const targetDate = bulkMeetingDate;
        const targetStatus = bulkStatus;
        const membersToMark = clubMembers.filter(m => selectedMemberIds.includes(m.id));

        try {
            // 1. Delete previous records for these members on that date
            await supabase.from('club_attendance')
                .delete()
                .eq('meeting_date', targetDate)
                .in('member_id', selectedMemberIds);

            // 2. Batch insert in a single request
            const batchRecords = membersToMark.map(m => ({
                member_id: m.id,
                meeting_date: targetDate,
                club_name: m.club_name || 'GBN Club',
                chapter_name: m.chapter_name || 'Megha Chapter',
                is_home_chapter: true,
                status: targetStatus,
                marked_by: profile?.id || null,
            }));

            const { data, error } = await supabase.from('club_attendance').insert(batchRecords).select();
            if (error) throw error;

            // 3. Immediately update local state without global refetch
            setLocalAttendance(prev => {
                const cleaned = prev.filter(a => !(a.meeting_date === targetDate && selectedMemberIds.includes(a.member_id)));
                return [...(data || batchRecords), ...cleaned];
            });

            setBulkSuccessMessage(`Marked ${selectedMemberIds.length} members as ${targetStatus} on ${formatDate(targetDate)}!`);
            setTimeout(() => {
                setBulkSuccessMessage(null);
                setIsBulkAttendanceOpen(false);
                setSelectedMemberIds([]);
            }, 1200);
        } catch (err: any) {
            console.error('Bulk attendance error:', err);
            alert('Failed to save bulk attendance: ' + (err.message || err));
        } finally {
            setBulkSaving(false);
        }
    };

    const handleQuickMarkSelectedPresentToday = async () => {
        if (selectedMemberIds.length === 0) return;
        const today = new Date().toISOString().slice(0, 10);
        setBulkSaving(true);
        const membersToMark = clubMembers.filter(m => selectedMemberIds.includes(m.id));

        try {
            await supabase.from('club_attendance')
                .delete()
                .eq('meeting_date', today)
                .in('member_id', selectedMemberIds);

            const batchRecords = membersToMark.map(m => ({
                member_id: m.id,
                meeting_date: today,
                club_name: m.club_name || 'GBN Club',
                chapter_name: m.chapter_name || 'Megha Chapter',
                is_home_chapter: true,
                status: 'Present',
                marked_by: profile?.id || null,
            }));

            const { data, error } = await supabase.from('club_attendance').insert(batchRecords).select();
            if (error) throw error;

            setLocalAttendance(prev => {
                const cleaned = prev.filter(a => !(a.meeting_date === today && selectedMemberIds.includes(a.member_id)));
                return [...(data || batchRecords), ...cleaned];
            });

            setSelectedMemberIds([]);
        } catch (err: any) {
            console.error('Quick bulk attendance error:', err);
            alert('Failed to mark attendance: ' + (err.message || err));
        } finally {
            setBulkSaving(false);
        }
    };

    // ─── Save New Member ──────────────────────────────────────────────────────
    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addForm.full_name.trim() || !addForm.phone.trim() || !addForm.membership_no.trim()) {
            alert('Full Name, Phone Number, and Membership ID are required.');
            return;
        }

        setSaving(true);
        try {
            let finalChapter = isManualChapter ? addForm.manual_chapter_name.trim() : addForm.chapter_name;
            if (!finalChapter) finalChapter = 'General';

            // Auto-create chapter in database if manually added
            if (isManualChapter && addForm.manual_chapter_name.trim()) {
                await supabase.from('club_chapters').insert({
                    club_name: addForm.club_name,
                    name: addForm.manual_chapter_name.trim(),
                    city: 'Kolhapur',
                }).select();
            }

            // Calculate sales total if linked customer
            let totalSpent = 0;
            if (addForm.customer_id) {
                const customerSales = sales.filter(s => s.customer_id === addForm.customer_id);
                totalSpent = customerSales.reduce((acc, curr) => acc + (Number(curr.final_price) || 0), 0);
            }

            const memberPayload = {
                customer_id: addForm.customer_id ? addForm.customer_id : null,
                full_name: addForm.full_name.trim(),
                phone: addForm.phone.trim(),
                email: addForm.email.trim() || null,
                membership_no: addForm.membership_no.trim().toUpperCase(),
                status: addForm.status,
                joining_date: addForm.joining_date,
                expiry_date: addForm.expiry_date ? addForm.expiry_date : null,
                total_spent: totalSpent,
                club_name: addForm.club_name,
                chapter_name: finalChapter,
                business_category: addForm.business_category.trim() || null,
                referred_by: addForm.referred_by.trim() || null,
                notes: addForm.notes.trim() || null,
                business_name: addForm.business_name.trim() || null,
                business_type: addForm.business_type.trim() || null,
                business_services: addForm.business_services.trim() || null,
                whatsapp_number: addForm.whatsapp_number.trim() || null,
                alternate_phone: addForm.alternate_phone.trim() || null,
                home_address: addForm.home_address.trim() || null,
                business_address: addForm.business_address.trim() || null,
                points: 0, 
                added_by: profile?.id || null,
            };

            const { error: memberError } = await supabase
                .from('club_members')
                .insert(memberPayload);

            if (memberError) throw memberError;

            setIsAdding(false);
            setAddForm(emptyMemberForm);
            setCustomerSearchQuery('');
            setIsManualChapter(false);
            refreshData();
        } catch (err: any) {
            console.error('Failed to add member:', err);
            alert('Failed to add member: ' + (err.message || err));
        } finally {
            setSaving(false);
        }
    };

    // ─── Update Member ────────────────────────────────────────────────────────
    const handleUpdateMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!detail) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('club_members')
                .update({
                    full_name: editForm.full_name.trim(),
                    phone: editForm.phone.trim(),
                    email: editForm.email.trim() || null,
                    status: editForm.status,
                    club_name: editForm.club_name,
                    chapter_name: editForm.chapter_name,
                    expiry_date: editForm.expiry_date ? editForm.expiry_date : null,
                    referred_by: editForm.referred_by?.trim() || null,
                    notes: editForm.notes?.trim() || null,
                    business_name: editForm.business_name?.trim() || null,
                    business_type: editForm.business_type?.trim() || null,
                    business_category: editForm.business_category?.trim() || null,
                    business_services: editForm.business_services?.trim() || null,
                    whatsapp_number: editForm.whatsapp_number?.trim() || null,
                    alternate_phone: editForm.alternate_phone?.trim() || null,
                    home_address: editForm.home_address?.trim() || null,
                    business_address: editForm.business_address?.trim() || null,
                })
                .eq('id', detail.id);

            if (error) throw error;
            
            setDetail({
                ...detail,
                ...editForm,
            });
            alert('Member updated successfully!');
            refreshData();
        } catch (err: any) {
            console.error('Failed to update member:', err);
            alert('Failed to update member: ' + (err.message || err));
        } finally {
            setSaving(false);
        }
    };

    // ─── Delete Member ────────────────────────────────────────────────────────
    const handleDeleteMember = async () => {
        if (!detail) return;
        if (!window.confirm(`Are you sure you want to delete ${detail.full_name}? All associated records will also be removed.`)) return;
        setDeleting(true);
        try {
            const { error } = await supabase.from('club_members').delete().eq('id', detail.id);
            if (error) throw error;
            setDetail(null);
            refreshData();
        } catch (err: any) {
            console.error('Failed to delete member:', err);
            alert('Failed to delete member: ' + (err.message || err));
        } finally {
            setDeleting(false);
        }
    };

    // ─── Add Attendance Record ────────────────────────────────────────────────
    const handleLogAttendance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!detail) return;
        setSaving(true);
        try {
            const { data, error } = await supabase.from('club_attendance').insert({
                member_id: detail.id,
                meeting_date: attendanceForm.meeting_date,
                club_name: detail.club_name || 'GBN Club',
                chapter_name: attendanceForm.chapter_name || detail.chapter_name || 'Home Chapter',
                is_home_chapter: attendanceForm.is_home_chapter,
                status: attendanceForm.status,
                substitute_name: attendanceForm.status === 'Substitute' ? attendanceForm.substitute_name : null,
                notes: attendanceForm.notes.trim() || null,
                marked_by: profile?.id || null,
            }).select().single();
            if (error) throw error;
            if (data) {
                setLocalAttendance(prev => [data, ...prev]);
            }
            setAttendanceForm(prev => ({ ...prev, notes: '', substitute_name: '' }));
        } catch (err: any) {
            alert('Failed to log attendance: ' + (err.message || err));
        } finally {
            setSaving(false);
        }
    };

    // ─── Add Feature Presentation ─────────────────────────────────────────────
    const handleLogPresentation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!detail || !presentationForm.topic.trim()) return;
        setSaving(true);
        try {
            const { error } = await supabase.from('club_presentations').insert({
                member_id: detail.id,
                presentation_date: presentationForm.presentation_date,
                topic: presentationForm.topic.trim(),
                presentation_type: presentationForm.presentation_type,
                chapter_name: presentationForm.chapter_name || detail.chapter_name || 'Home Chapter',
                is_cross_chapter: presentationForm.is_cross_chapter,
                notes: presentationForm.notes.trim() || null,
            });
            if (error) throw error;
            setPresentationForm(prev => ({ ...prev, topic: '', notes: '' }));
            refreshData();
        } catch (err: any) {
            alert('Failed to log presentation: ' + (err.message || err));
        } finally {
            setSaving(false);
        }
    };

    // ─── Add 1-to-1 Meeting ───────────────────────────────────────────────────
    const handleLogOneToOne = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!detail) return;
        
        let targetName = oneToOneForm.with_member_name;
        if (oneToOneForm.with_member_id) {
            const partner = clubMembers.find(m => m.id === oneToOneForm.with_member_id);
            if (partner) targetName = partner.full_name;
        }

        if (!targetName.trim()) {
            alert('Please select or enter the member with whom 1-to-1 was conducted.');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase.from('club_one_to_one').insert({
                initiator_member_id: detail.id,
                with_member_id: oneToOneForm.with_member_id || null,
                with_member_name: targetName.trim(),
                meeting_date: oneToOneForm.meeting_date,
                location: oneToOneForm.location.trim() || null,
                chapter_name: oneToOneForm.chapter_name || detail.chapter_name || 'General',
                discussion_topics: oneToOneForm.discussion_topics.trim() || null,
                outcomes: oneToOneForm.outcomes.trim() || null,
            });
            if (error) throw error;
            setOneToOneForm(prev => ({ ...prev, with_member_id: '', with_member_name: '', location: '', discussion_topics: '', outcomes: '' }));
            refreshData();
        } catch (err: any) {
            alert('Failed to log 1-to-1 meeting: ' + (err.message || err));
        } finally {
            setSaving(false);
        }
    };

    // ─── Add 1-to-Many Session ────────────────────────────────────────────────
    const handleLogOneToMany = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!detail || !oneToManyForm.title.trim()) return;

        const attendeeNames = clubMembers
            .filter(m => oneToManyForm.attendee_ids.includes(m.id))
            .map(m => m.full_name);

        setSaving(true);
        try {
            const { error } = await supabase.from('club_one_to_many').insert({
                host_member_id: detail.id,
                host_name: detail.full_name,
                title: oneToManyForm.title.trim(),
                meeting_date: oneToManyForm.meeting_date,
                location_or_mode: oneToManyForm.location_or_mode.trim() || null,
                attendee_ids: oneToManyForm.attendee_ids,
                attendee_names: attendeeNames,
                attendee_count: oneToManyForm.attendee_ids.length,
                key_takeaways: oneToManyForm.key_takeaways.trim() || null,
            });
            if (error) throw error;
            setOneToManyForm({
                title: '',
                meeting_date: new Date().toISOString().slice(0, 10),
                location_or_mode: '',
                attendee_ids: [],
                key_takeaways: '',
            });
            refreshData();
        } catch (err: any) {
            alert('Failed to log 1-to-many session: ' + (err.message || err));
        } finally {
            setSaving(false);
        }
    };

    // ─── Add Referral ─────────────────────────────────────────────────────────
    const handleLogReferral = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!detail || !referralForm.referral_name.trim()) return;

        let giverId = detail.id;
        let giverName = detail.full_name;
        let receiverId: string | null = referralForm.partner_member_id || null;
        let receiverName = referralForm.partner_name;

        if (referralForm.direction === 'received') {
            giverId = referralForm.partner_member_id || '';
            giverName = referralForm.partner_name || 'Club Member';
            receiverId = detail.id;
            receiverName = detail.full_name;
        }

        setSaving(true);
        try {
            const { error } = await supabase.from('club_referrals').insert({
                giver_member_id: giverId || null,
                giver_name: giverName,
                receiver_member_id: receiverId || null,
                receiver_name: receiverName,
                referral_name: referralForm.referral_name.trim(),
                referral_phone: referralForm.referral_phone.trim() || null,
                referral_type: referralForm.referral_type,
                status: referralForm.status,
                estimated_value: Number(referralForm.estimated_value) || 0.00,
                notes: referralForm.notes.trim() || null,
            });
            if (error) throw error;
            setReferralForm(prev => ({ ...prev, referral_name: '', referral_phone: '', estimated_value: '', notes: '' }));
            refreshData();
        } catch (err: any) {
            alert('Failed to log referral: ' + (err.message || err));
        } finally {
            setSaving(false);
        }
    };

    // ─── Add Done Deal / Business Volume ──────────────────────────────────────
    const handleLogBusinessDeal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!detail || !businessDealForm.amount) return;

        let givenByName = businessDealForm.given_by_name;
        if (businessDealForm.given_by_member_id) {
            const giver = clubMembers.find(m => m.id === businessDealForm.given_by_member_id);
            if (giver) givenByName = giver.full_name;
        }

        setSaving(true);
        try {
            const { error } = await supabase.from('club_business_deals').insert({
                member_id: detail.id,
                given_by_member_id: businessDealForm.given_by_member_id || null,
                given_by_name: givenByName || 'Fellow Member',
                amount: Number(businessDealForm.amount) || 0.00,
                deal_type: businessDealForm.deal_type,
                deal_date: businessDealForm.deal_date,
                chapter_name: businessDealForm.chapter_name || detail.chapter_name || 'General',
                notes: businessDealForm.notes.trim() || null,
            });
            if (error) throw error;
            setBusinessDealForm(prev => ({ ...prev, amount: '', given_by_member_id: '', given_by_name: '', notes: '' }));
            refreshData();
        } catch (err: any) {
            alert('Failed to log business volume: ' + (err.message || err));
        } finally {
            setSaving(false);
        }
    };

    // ─── Add Service Exchange ──────────────────────────────────────────────────
    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!detail || !txForm.service_name.trim()) return;

        setSaving(true);
        try {
            const { error } = await supabase.from('club_service_exchanges').insert({
                member_id: detail.id,
                exchange_type: txForm.exchange_type,
                service_name: txForm.service_name.trim(),
                equivalent_value: Number(txForm.equivalent_value) || 0.00,
                notes: txForm.notes.trim() || null,
                added_by: profile?.id
            });
            if (error) throw error;

            setTxForm({
                exchange_type: 'taken_from_member',
                service_name: '',
                equivalent_value: '',
                notes: '',
            });

            refreshData();
        } catch (err: any) {
            alert('Failed to log service transaction: ' + (err.message || err));
        } finally {
            setSaving(false);
        }
    };

    // ─── Add New Club / Chapter Handlers ──────────────────────────────────────
    const handleAddNewClub = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClubForm.name.trim()) return;
        setSaving(true);
        try {
            const { error } = await supabase.from('networking_clubs').insert({
                name: newClubForm.name.trim(),
                code: newClubForm.code.trim().toUpperCase() || newClubForm.name.slice(0, 3).toUpperCase(),
                description: newClubForm.description.trim() || null,
            });
            if (error) throw error;
            setNewClubForm({ name: '', code: '', description: '' });
            refreshData();
            alert('New Club added successfully!');
        } catch (err: any) {
            alert('Failed to add club: ' + (err.message || err));
        } finally {
            setSaving(false);
        }
    };

    const handleAddNewChapter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChapterForm.name.trim()) return;
        setSaving(true);
        try {
            const { error } = await supabase.from('club_chapters').insert({
                club_name: newChapterForm.club_name,
                name: newChapterForm.name.trim(),
                city: newChapterForm.city.trim() || 'Kolhapur',
                meeting_day: newChapterForm.meeting_day,
            });
            if (error) throw error;
            setNewChapterForm(prev => ({ ...prev, name: '' }));
            refreshData();
            alert('New Chapter created successfully!');
        } catch (err: any) {
            alert('Failed to create chapter: ' + (err.message || err));
        } finally {
            setSaving(false);
        }
    };

    // ─── CSV / Excel Export ───────────────────────────────────────────────────
    const exportToCSV = () => {
        const headers = [
            'Membership ID',
            'Member Name',
            'Phone',
            'WhatsApp',
            'Alternate Phone',
            'Email',
            'Club',
            'Chapter',
            'Business Name',
            'Business Category',
            'Services Offered',
            'Status',
            'Total Meetings Attended',
            'Home Chapter Attended',
            'Cross Chapter Attended',
            'Presentations Given',
            '1-to-1 Meetings Done',
            '1-to-Many Hosted',
            '1-to-Many Attended',
            'Referrals Given',
            'Referrals Received',
            'Business Volume Done Deal (INR)',
            'Total Spent (INR)',
            'Joining Date',
            'Residential Address',
            'Business Address',
            'Notes'
        ];

        const rows = filteredMembers.map(m => {
            const met = memberMetricsMap[m.id] || {
                attendanceTotal: 0,
                homeAttendance: 0,
                crossAttendance: 0,
                presentations: 0,
                oneToOne: 0,
                oneToManyHosted: 0,
                oneToManyAttended: 0,
                businessVolume: 0,
                referralsGiven: 0,
                referralsReceived: 0,
            };

            return [
                `"${m.membership_no || ''}"`,
                `"${(m.full_name || '').replace(/"/g, '""')}"`,
                `"${m.phone || ''}"`,
                `"${m.whatsapp_number || ''}"`,
                `"${m.alternate_phone || ''}"`,
                `"${m.email || ''}"`,
                `"${m.club_name || 'GBN Club'}"`,
                `"${m.chapter_name || 'Megha Chapter'}"`,
                `"${(m.business_name || '').replace(/"/g, '""')}"`,
                `"${(m.business_category || m.business_type || '').replace(/"/g, '""')}"`,
                `"${(m.business_services || '').replace(/"/g, '""')}"`,
                `"${m.status}"`,
                met.attendanceTotal,
                met.homeAttendance,
                met.crossAttendance,
                met.presentations,
                met.oneToOne,
                met.oneToManyHosted,
                met.oneToManyAttended,
                met.referralsGiven,
                met.referralsReceived,
                met.businessVolume,
                m.total_spent || 0,
                `"${m.joining_date || ''}"`,
                `"${(m.home_address || '').replace(/"/g, '""')}"`,
                `"${(m.business_address || '').replace(/"/g, '""')}"`,
                `"${(m.notes || '').replace(/"/g, '""')}"`
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `club_members_${selectedClub !== 'all' ? selectedClub.toLowerCase().replace(/\s+/g, '_') : 'all'}_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ─── Status Badge Colors ──────────────────────────────────────────────────
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Inactive': return 'bg-slate-100 text-slate-500 border-slate-200';
            case 'Suspended': return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'Expired': return 'bg-amber-50 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const allClubsList = useMemo(() => {
        const defaultClubs = [
            { name: 'GBN Club', code: 'GBN' },
            { name: 'Saturday Club', code: 'SAT' },
            { name: 'BNI Club', code: 'BNI' },
            { name: 'Rotary Club', code: 'ROT' },
        ];
        const existingNames = new Set(defaultClubs.map(c => c.name.toLowerCase()));
        const customClubs = clubs.filter(c => !existingNames.has(c.name.toLowerCase()));
        return [...defaultClubs, ...customClubs];
    }, [clubs]);

    const todayDateStr = new Date().toISOString().slice(0, 10);

    return (
        <div className="space-y-6 text-left pb-12">
            {/* Header with Title & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="size-11 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0 shadow-sm">
                            <span className="material-symbols-outlined text-2xl">diversity_3</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-primary font-display flex items-center gap-2 tracking-tight">
                                Business Networking & Club Directory
                            </h1>
                            <p className="text-slate-500 text-xs font-medium">
                                Manage clubs, chapters, attendance, presentations, 1-to-1 meetings, group sessions, and done deals.
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                    <button 
                        onClick={() => setIsManagingClubs(true)}
                        className="h-10 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
                        title="Add/Manage Clubs & Chapters"
                    >
                        <span className="material-symbols-outlined text-base text-primary">account_tree</span> Manage Clubs & Chapters
                    </button>
                    
                    <button 
                        onClick={exportToCSV}
                        className="h-10 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
                        title="Export to CSV / Excel"
                    >
                        <span className="material-symbols-outlined text-base text-emerald-600">table_view</span> Export Excel
                    </button>

                    <button 
                        onClick={() => setIsBulkAttendanceOpen(true)}
                        className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                        title="Mark Attendance for Multiple Members for Any Date"
                    >
                        <span className="material-symbols-outlined text-base">event_available</span> Mark Bulk Attendance
                    </button>

                    <button 
                        onClick={() => setIsAdding(true)} 
                        className="h-10 px-4 bg-primary text-white font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-primary-light transition shadow-sm"
                    >
                        <span className="material-symbols-outlined text-base">person_add</span> Add Club Member
                    </button>

                    <button 
                        onClick={refreshData} 
                        className="h-10 w-10 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition bg-white shadow-sm" 
                        title="Refresh"
                    >
                        <span className="material-symbols-outlined text-lg">refresh</span>
                    </button>
                </div>
            </div>

            {/* Club Switcher Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                    onClick={() => { setSelectedClub('all'); setSelectedChapter('all'); }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap shadow-sm ${
                        selectedClub === 'all'
                            ? 'bg-primary text-white ring-2 ring-primary/20'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <span className="material-symbols-outlined text-sm">groups</span>
                    All Clubs ({clubMembers.length})
                </button>

                {allClubsList.map(club => {
                    const count = clubMembers.filter(m => (m.club_name || 'GBN Club').toLowerCase() === club.name.toLowerCase()).length;
                    const isSelected = selectedClub.toLowerCase() === club.name.toLowerCase();
                    return (
                        <button
                            key={club.name}
                            onClick={() => { setSelectedClub(club.name); setSelectedChapter('all'); }}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap shadow-sm ${
                                isSelected
                                    ? 'bg-primary text-white ring-2 ring-primary/20'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <span className="size-2 rounded-full bg-emerald-400"></span>
                            {club.name} ({count})
                        </button>
                    );
                })}

                <button
                    onClick={() => setIsManagingClubs(true)}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-dashed border-primary/30 flex items-center gap-1 whitespace-nowrap transition shadow-sm"
                >
                    <span className="material-symbols-outlined text-sm">add</span> New Club
                </button>
            </div>

            {/* Executive Analytics Dashboard Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                <div className="bg-white border border-slate-100 shadow-sm p-4 rounded-2xl flex items-center gap-3.5">
                    <div className="size-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-xl">group</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Members</p>
                        <p className="text-xl font-black text-primary">{stats.total}</p>
                    </div>
                </div>

                <div className="bg-white border border-slate-100 shadow-sm p-4 rounded-2xl flex items-center gap-3.5">
                    <div className="size-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                        <span className="material-symbols-outlined text-xl">verified</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Members</p>
                        <p className="text-xl font-black text-emerald-600">{stats.active}</p>
                    </div>
                </div>

                <div className="bg-white border border-slate-100 shadow-sm p-4 rounded-2xl flex items-center gap-3.5">
                    <div className="size-11 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                        <span className="material-symbols-outlined text-xl">event_available</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meetings Attended</p>
                        <p className="text-xl font-black text-blue-700">{stats.totalAttendance}</p>
                    </div>
                </div>

                <div className="bg-white border border-slate-100 shadow-sm p-4 rounded-2xl flex items-center gap-3.5">
                    <div className="size-11 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                        <span className="material-symbols-outlined text-xl">handshake</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">1-to-1s & Group</p>
                        <p className="text-xl font-black text-purple-700">{stats.totalOneToOne} / {stats.totalOneToMany}</p>
                    </div>
                </div>

                <div className="bg-white border border-slate-100 shadow-sm p-4 rounded-2xl flex items-center gap-3.5 col-span-2 lg:col-span-1">
                    <div className="size-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                        <span className="material-symbols-outlined text-xl">payments</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Done Deals (Volume)</p>
                        <p className="text-lg font-black text-slate-800">{formatCurrency(stats.totalBusinessVolume)}</p>
                    </div>
                </div>
            </div>

            {/* Filters, Chapter Dropdown & Search Bar */}
            <div className="bg-white p-3.5 border border-slate-100 rounded-2xl shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                    {/* Search box */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 flex-1">
                        <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
                        <input 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="Search by name, phone, business, category, chapter, membership ID..." 
                            className="bg-transparent text-xs text-primary outline-none w-full font-medium" 
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="material-symbols-outlined text-slate-400 text-base hover:text-slate-600">
                                close
                            </button>
                        )}
                    </div>

                    {/* Chapter selector */}
                    <div className="flex items-center gap-2">
                        <select 
                            value={selectedChapter} 
                            onChange={e => setSelectedChapter(e.target.value)}
                            className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer"
                        >
                            <option value="all">All Chapters</option>
                            {availableChaptersForClub(selectedClub).map(ch => (
                                <option key={ch.id || ch.name} value={ch.name}>
                                    {ch.name} ({ch.club_name || selectedClub})
                                </option>
                            ))}
                        </select>

                        {/* Status filter */}
                        <select 
                            value={statusFilter} 
                            onChange={e => setStatusFilter(e.target.value)}
                            className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer"
                        >
                            <option value="all">All Statuses</option>
                            <option value="Active">Active Only</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Suspended">Suspended</option>
                            <option value="Expired">Expired</option>
                        </select>

                        {/* Attendance filter */}
                        <select 
                            value={attendanceFilter} 
                            onChange={e => setAttendanceFilter(e.target.value)}
                            className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer"
                        >
                            <option value="all">All Attendance</option>
                            <option value="attended_any">Attended &gt; 0</option>
                            <option value="zero_attendance">Zero Attendance</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Members Directory Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto relative">
                    <table className="w-full min-w-[980px]">
                        <thead>
                            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/60">
                                <th className="w-10 px-4 py-3.5 text-center">
                                    <input 
                                        type="checkbox"
                                        checked={filteredMembers.length > 0 && selectedMemberIds.length === filteredMembers.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedMemberIds(filteredMembers.map(m => m.id));
                                            } else {
                                                setSelectedMemberIds([]);
                                            }
                                        }}
                                        className="size-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                                        title="Select all members"
                                    />
                                </th>
                                <th className="text-left px-5 py-3.5">ID / Joined</th>
                                <th className="text-left px-5 py-3.5">Member Name & Contact</th>
                                <th className="text-left px-5 py-3.5">Club & Chapter</th>
                                <th className="text-left px-5 py-3.5">Business Details</th>
                                <th className="text-center px-4 py-3.5">Today Attendance</th>
                                <th className="text-center px-4 py-3.5">Meetings (Home / Cross)</th>
                                <th className="text-center px-4 py-3.5">Presentations</th>
                                <th className="text-center px-4 py-3.5">1-to-1s</th>
                                <th className="text-left px-5 py-3.5">Done Deals (₹)</th>
                                <th className="text-center px-4 py-3.5">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={11} className="py-16 text-center text-slate-400">
                                        <div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                                        Loading membership & networking records...
                                    </td>
                                </tr>
                            ) : filteredMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="py-16 text-center">
                                        <span className="material-symbols-outlined text-4xl text-slate-200 mb-2 block">groups_3</span>
                                        <p className="text-slate-500 font-bold text-sm">No members found matching your filters</p>
                                        <p className="text-xs text-slate-400 mt-1">Add a new member or adjust your filter selection.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredMembers.map((m: ClubMember) => {
                                    const metrics = memberMetricsMap[m.id] || {
                                        attendanceTotal: 0,
                                        homeAttendance: 0,
                                        crossAttendance: 0,
                                        presentations: 0,
                                        oneToOne: 0,
                                        oneToManyHosted: 0,
                                        oneToManyAttended: 0,
                                        businessVolume: 0,
                                    };

                                    const isAttendedToday = localAttendance.some(
                                        a => a.member_id === m.id && a.meeting_date === todayDateStr && a.status === 'Present'
                                    );

                                    return (
                                        <tr 
                                            key={m.id}
                                            onClick={() => handleOpenDetail(m)}
                                            className="hover:bg-slate-50/70 cursor-pointer transition-colors group"
                                        >
                                            {/* Row Selection Checkbox */}
                                            <td className="w-10 px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <input 
                                                    type="checkbox"
                                                    checked={selectedMemberIds.includes(m.id)}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        if (e.target.checked) {
                                                            setSelectedMemberIds(prev => [...prev, m.id]);
                                                        } else {
                                                            setSelectedMemberIds(prev => prev.filter(id => id !== m.id));
                                                        }
                                                    }}
                                                    className="size-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                                                />
                                            </td>

                                            {/* Membership ID & Joined */}
                                            <td className="px-5 py-4">
                                                <span className="text-[11px] font-black bg-slate-100 text-slate-700 px-2 py-1 rounded-lg border border-slate-200 tracking-wide font-mono block w-max">
                                                    <HighlightText text={m.membership_no} highlight={search} />
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                                                    {formatDate(m.joining_date)}
                                                </span>
                                            </td>

                                            {/* Member Name & Contacts */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-2xl bg-gradient-to-br from-primary via-primary-light to-indigo-800 text-white flex items-center justify-center text-sm font-black shrink-0 shadow-sm">
                                                        {m.full_name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="text-sm font-bold text-slate-800 group-hover:text-primary transition">
                                                                <HighlightText text={m.full_name} highlight={search} />
                                                            </p>
                                                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md border ${getStatusBadge(m.status)}`}>
                                                                {m.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                                                            <span><HighlightText text={m.phone} highlight={search} /></span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Club & Chapter */}
                                            <td className="px-5 py-4">
                                                <div className="space-y-1">
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary/5 text-primary px-2 py-0.5 rounded-md border border-primary/15">
                                                        <span className="material-symbols-outlined text-[13px]">shield</span>
                                                        <HighlightText text={m.club_name || 'GBN Club'} highlight={search} />
                                                    </span>
                                                    <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-xs text-slate-400">location_on</span>
                                                        <HighlightText text={m.chapter_name || 'Megha Chapter'} highlight={search} />
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Business Details */}
                                            <td className="px-5 py-4">
                                                {m.business_name ? (
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800 max-w-[190px] truncate">
                                                            <HighlightText text={m.business_name} highlight={search} />
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-medium max-w-[190px] truncate">
                                                            <HighlightText text={m.business_category || m.business_type || 'Business Member'} highlight={search} />
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-300 italic">No business linked</span>
                                                )}
                                            </td>

                                            {/* Today Attendance Quick Toggle ✅ */}
                                            <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => handleQuickAttendanceToggle(e, m)}
                                                    className={`size-8 rounded-xl flex items-center justify-center transition shadow-sm mx-auto ${
                                                        isAttendedToday
                                                            ? 'bg-emerald-500 text-white hover:bg-emerald-600 ring-2 ring-emerald-200'
                                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                                                    }`}
                                                    title={isAttendedToday ? 'Attended Today (Click to toggle off)' : 'Mark Attended Today (Click to toggle on)'}
                                                >
                                                    <span className="material-symbols-outlined text-lg">
                                                        {isAttendedToday ? 'check_circle' : 'radio_button_unchecked'}
                                                    </span>
                                                </button>
                                            </td>

                                            {/* Meetings Attended Count */}
                                            <td className="px-4 py-4 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="text-xs font-black text-slate-800">
                                                        {metrics.attendanceTotal}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 font-medium">
                                                        🏠 {metrics.homeAttendance} | 🌐 {metrics.crossAttendance}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Presentations Count */}
                                            <td className="px-4 py-4 text-center">
                                                <span className="inline-flex items-center justify-center size-6 rounded-lg text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                                                    {metrics.presentations}
                                                </span>
                                            </td>

                                            {/* 1-to-1s Count */}
                                            <td className="px-4 py-4 text-center">
                                                <span className="inline-flex items-center justify-center size-6 rounded-lg text-xs font-black bg-purple-50 text-purple-700 border border-purple-200">
                                                    {metrics.oneToOne}
                                                </span>
                                            </td>

                                            {/* Done Deals Business Volume */}
                                            <td className="px-5 py-4">
                                                <span className="text-xs font-black text-slate-800 block">
                                                    {formatCurrency(metrics.businessVolume)}
                                                </span>
                                            </td>

                                            {/* Quick Actions */}
                                            <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1">
                                                    <a 
                                                        href={`tel:${m.phone}`} 
                                                        className="size-7 rounded-lg hover:bg-emerald-50 text-emerald-600 flex items-center justify-center transition"
                                                        title="Call Member"
                                                    >
                                                        <span className="material-symbols-outlined text-base">call</span>
                                                    </a>
                                                    <a 
                                                        href={toWhatsAppUrl(m.whatsapp_number || m.phone)} 
                                                        target="_blank" 
                                                        rel="noreferrer" 
                                                        className="size-7 rounded-lg hover:bg-emerald-50 text-[#25D366] flex items-center justify-center transition" 
                                                        title="WhatsApp"
                                                    >
                                                        <span className="material-symbols-outlined text-base">chat</span>
                                                    </a>
                                                    <button
                                                        onClick={() => handleOpenDetail(m)}
                                                        className="size-7 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center transition"
                                                        title="View 360 Profile"
                                                    >
                                                        <span className="material-symbols-outlined text-base">visibility</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sticky Multi-Member Action Bar */}
            {selectedMemberIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl px-6 py-3.5 flex items-center gap-4 sm:gap-6 shadow-2xl border border-slate-800 animate-slide-up">
                    <span className="text-xs sm:text-sm font-semibold whitespace-nowrap flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                        {selectedMemberIds.length} {selectedMemberIds.length === 1 ? 'member' : 'members'} selected
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleQuickMarkSelectedPresentToday}
                            disabled={bulkSaving}
                            className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
                            title="Mark selected members present for today"
                        >
                            <span className="material-symbols-outlined text-base">check_circle</span>
                            Mark Present Today
                        </button>
                        <button
                            onClick={() => setIsBulkAttendanceOpen(true)}
                            disabled={bulkSaving}
                            className="h-9 px-3.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition border border-white/15 cursor-pointer disabled:opacity-50"
                            title="Mark attendance for a specific date"
                        >
                            <span className="material-symbols-outlined text-base">calendar_month</span>
                            Mark for Date...
                        </button>
                        <button
                            onClick={() => setSelectedMemberIds([])}
                            className="text-xs text-slate-400 hover:text-white px-2 py-1 transition cursor-pointer"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
                MODAL: BULK ATTENDANCE FOR MULTIPLE MEMBERS & ANY PARTICULAR DATE
               ══════════════════════════════════════════════════════════════════════════ */}
            {isBulkAttendanceOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-8 text-left animate-in fade-in zoom-in-95 duration-200 border border-slate-100 flex flex-col max-h-[88vh]">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 flex items-center justify-between text-white shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="size-10 rounded-xl bg-white/15 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-2xl font-black">event_available</span>
                                </div>
                                <div>
                                    <h2 className="text-base font-black">Mark Bulk Attendance</h2>
                                    <p className="text-[11px] text-white/80">Record meeting attendance for multiple members in one step</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setIsBulkAttendanceOpen(false); setBulkSuccessMessage(null); }} 
                                disabled={bulkSaving}
                                className="size-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5 overflow-y-auto flex-1">
                            {bulkSuccessMessage && (
                                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 font-bold animate-in fade-in">
                                    <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                                    {bulkSuccessMessage}
                                </div>
                            )}

                            {/* Meeting Controls: Date & Status */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm text-emerald-600">calendar_today</span>
                                        Meeting Date *
                                    </label>
                                    <input 
                                        type="date"
                                        value={bulkMeetingDate}
                                        onChange={(e) => setBulkMeetingDate(e.target.value)}
                                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm text-emerald-600">how_to_reg</span>
                                        Attendance Status *
                                    </label>
                                    <div className="flex gap-1.5">
                                        {(['Present', 'Absent', 'Late', 'Substitute'] as const).map(st => (
                                            <button
                                                key={st}
                                                type="button"
                                                onClick={() => setBulkStatus(st)}
                                                className={`flex-1 h-10 rounded-xl text-xs font-bold transition border cursor-pointer ${
                                                    bulkStatus === st
                                                        ? st === 'Present'
                                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                                            : st === 'Absent'
                                                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                                            : 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                {st}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Member Selection Toolbar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-700">Select Members:</span>
                                    <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                        {selectedMemberIds.length} of {
                                            bulkChapterFilter === 'all' 
                                                ? clubMembers.length 
                                                : clubMembers.filter(m => (m.chapter_name || '').toLowerCase() === bulkChapterFilter.toLowerCase()).length
                                        } selected
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Chapter Filter in Modal */}
                                    <select
                                        value={bulkChapterFilter}
                                        onChange={(e) => setBulkChapterFilter(e.target.value)}
                                        className="h-8 px-2.5 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700"
                                    >
                                        <option value="all">All Chapters</option>
                                        {Array.from(new Set(clubMembers.map(m => m.chapter_name).filter(Boolean))).map(ch => (
                                            <option key={ch as string} value={ch as string}>{ch as string}</option>
                                        ))}
                                    </select>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const selectableMembers = bulkChapterFilter === 'all'
                                                ? clubMembers
                                                : clubMembers.filter(m => (m.chapter_name || '').toLowerCase() === bulkChapterFilter.toLowerCase());
                                            setSelectedMemberIds(selectableMembers.map(m => m.id));
                                        }}
                                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200/60 transition cursor-pointer"
                                    >
                                        Select All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedMemberIds([])}
                                        className="text-[11px] font-bold text-slate-500 hover:text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            {/* Member Checklist */}
                            <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-64 overflow-y-auto scrollbar-thin">
                                {clubMembers
                                    .filter(m => bulkChapterFilter === 'all' || (m.chapter_name || '').toLowerCase() === bulkChapterFilter.toLowerCase())
                                    .map(m => {
                                        const isSelected = selectedMemberIds.includes(m.id);
                                        const hasAttendanceOnDate = localAttendance.some(
                                            a => a.member_id === m.id && a.meeting_date === bulkMeetingDate && a.status === 'Present'
                                        );

                                        return (
                                            <label 
                                                key={m.id}
                                                className={`flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 transition ${
                                                    isSelected ? 'bg-emerald-50/40' : ''
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input 
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => {
                                                            setSelectedMemberIds(prev => 
                                                                prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id]
                                                            );
                                                        }}
                                                        className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                                                    />
                                                    <div className="size-8 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                                                        {m.full_name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                            {m.full_name}
                                                            {hasAttendanceOnDate && (
                                                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                                                                    Already Present
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">
                                                            {m.membership_no} • {m.chapter_name || 'General'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-mono font-semibold text-slate-400">
                                                    {m.phone}
                                                </span>
                                            </label>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                            <p className="text-[11px] text-slate-400">
                                Applies to date: <span className="font-bold text-slate-600">{formatDate(bulkMeetingDate)}</span>
                            </p>
                            <div className="flex items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => { setIsBulkAttendanceOpen(false); setBulkSuccessMessage(null); }}
                                    disabled={bulkSaving}
                                    className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-white transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleBulkAttendanceSubmit()}
                                    disabled={selectedMemberIds.length === 0 || bulkSaving}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                    {bulkSaving ? (
                                        <>
                                            <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-base">done_all</span>
                                            Save Attendance ({selectedMemberIds.length})
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
                MODAL: ADD CLUB MEMBER (WITH CHAPTER MANUAL / AUTO LOGIC)
               ══════════════════════════════════════════════════════════════════════════ */}
            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden my-8 text-left animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-primary to-primary-light px-6 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-2xl font-black">person_add</span>
                                <div>
                                    <h2 className="text-base font-black">Register New Club Member</h2>
                                    <p className="text-[11px] text-white/70">Enter personal, chapter & business details</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setIsAdding(false); setAddForm(emptyMemberForm); setCustomerSearchQuery(''); }} 
                                className="size-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleAddMember} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto scrollbar-thin">
                            {/* Link Existing Customer Profile */}
                            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm text-primary">link</span>
                                        Link Existing Customer (Optional)
                                    </label>
                                    {addForm.customer_id && (
                                        <button 
                                            type="button" 
                                            onClick={handleClearCustomerLink}
                                            className="text-[10px] font-bold text-red-500 hover:underline flex items-center gap-0.5"
                                        >
                                            <span className="material-symbols-outlined text-xs">link_off</span> Unlink
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 h-10 shadow-sm">
                                        <span className="material-symbols-outlined text-slate-400 text-sm">person_search</span>
                                        <input 
                                            value={customerSearchQuery} 
                                            onChange={e => {
                                                setCustomerSearchQuery(e.target.value);
                                                setShowCustomerDropdown(true);
                                                setAddForm(prev => ({ ...prev, full_name: e.target.value }));
                                            }}
                                            onFocus={() => setShowCustomerDropdown(true)}
                                            placeholder="Search customer name or phone to auto-fill..." 
                                            className="bg-transparent text-xs text-slate-800 outline-none w-full" 
                                        />
                                    </div>

                                    {showCustomerDropdown && matchedCustomers.length > 0 && (
                                        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100">
                                            {matchedCustomers.map(c => (
                                                <div 
                                                    key={c.id} 
                                                    onClick={() => handleSelectCustomer(c)}
                                                    className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex justify-between items-center text-xs transition"
                                                >
                                                    <div>
                                                        <p className="font-bold text-slate-800">{c.full_name}</p>
                                                        <p className="text-slate-400 text-[10px]">{c.phone} {c.email ? `• ${c.email}` : ''}</p>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Link Profile</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Club & Chapter Selection */}
                            <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 space-y-3">
                                <p className="text-[11px] font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-base">account_tree</span> Club & Chapter Assignment
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Select Club *</label>
                                        <select 
                                            value={addForm.club_name} 
                                            onChange={e => setAddForm({ ...addForm, club_name: e.target.value })}
                                            className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none bg-white font-bold text-slate-700"
                                        >
                                            {allClubsList.map(c => (
                                                <option key={c.name} value={c.name}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Chapter *</label>
                                            <button 
                                                type="button" 
                                                onClick={() => setIsManualChapter(!isManualChapter)}
                                                className="text-[10px] font-bold text-primary hover:underline"
                                            >
                                                {isManualChapter ? '← Choose from list' : '+ Type manually'}
                                            </button>
                                        </div>
                                        {isManualChapter ? (
                                            <input 
                                                required
                                                value={addForm.manual_chapter_name}
                                                onChange={e => setAddForm({ ...addForm, manual_chapter_name: e.target.value })}
                                                placeholder="Type Chapter Name (e.g., Varsha, Bavada)"
                                                className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none bg-white font-semibold text-slate-700"
                                            />
                                        ) : (
                                            <select 
                                                value={addForm.chapter_name} 
                                                onChange={e => setAddForm({ ...addForm, chapter_name: e.target.value })}
                                                className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none bg-white font-bold text-slate-700"
                                            >
                                                {activeClubChapters.length > 0 ? (
                                                    activeClubChapters.map(ch => (
                                                        <option key={ch.id || ch.name} value={ch.name}>{ch.name}</option>
                                                    ))
                                                ) : (
                                                    <option value="General">General Chapter</option>
                                                )}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Personal & Contact Information */}
                            <div className="space-y-3">
                                <p className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-base text-slate-400">contacts</span> Personal & Contact Info
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Full Name *</label>
                                        <input 
                                            required 
                                            value={addForm.full_name} 
                                            onChange={e => setAddForm({...addForm, full_name: e.target.value})} 
                                            className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-primary/10 font-semibold" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Phone Number *</label>
                                        <input 
                                            required 
                                            value={addForm.phone} 
                                            onChange={e => setAddForm({...addForm, phone: e.target.value})} 
                                            className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-primary/10 font-semibold" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">WhatsApp Number</label>
                                        <input 
                                            value={addForm.whatsapp_number} 
                                            onChange={e => setAddForm({...addForm, whatsapp_number: e.target.value})} 
                                            placeholder="With country code (e.g., 91...)"
                                            className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-primary/10" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Alternative Phone</label>
                                        <input 
                                            value={addForm.alternate_phone} 
                                            onChange={e => setAddForm({...addForm, alternate_phone: e.target.value})} 
                                            className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-primary/10" 
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Email Address</label>
                                        <input 
                                            type="email"
                                            value={addForm.email} 
                                            onChange={e => setAddForm({...addForm, email: e.target.value})} 
                                            className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-primary/10" 
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Home Residential Address</label>
                                        <input 
                                            value={addForm.home_address} 
                                            onChange={e => setAddForm({...addForm, home_address: e.target.value})} 
                                            placeholder="Residential Street Address, Area, City"
                                            className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-primary/10" 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Business Profile */}
                            <div className="space-y-3 border-t border-slate-100 pt-4">
                                <p className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-base text-slate-400">storefront</span> Business Profile
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Business / Company Name</label>
                                        <input 
                                            value={addForm.business_name} 
                                            onChange={e => setAddForm({...addForm, business_name: e.target.value})} 
                                            placeholder="Company, Shop or Brand Name"
                                            className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-primary/10 font-semibold" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Business Category / Type</label>
                                        <input 
                                            value={addForm.business_category} 
                                            onChange={e => setAddForm({...addForm, business_category: e.target.value, business_type: e.target.value})} 
                                            placeholder="e.g. Travel Agent, Architect, Real Estate"
                                            className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-primary/10" 
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Business Office Address</label>
                                        <input 
                                            value={addForm.business_address} 
                                            onChange={e => setAddForm({...addForm, business_address: e.target.value})} 
                                            placeholder="Office, Showroom or Commercial Address"
                                            className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-primary/10" 
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Services Provided</label>
                                        <textarea 
                                            rows={2}
                                            value={addForm.business_services} 
                                            onChange={e => setAddForm({...addForm, business_services: e.target.value})} 
                                            placeholder="Describe services, products or solutions provided..."
                                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/10 resize-none" 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Membership ID & Status */}
                            <div className="space-y-3 border-t border-slate-100 pt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Membership ID *</label>
                                        <input 
                                            required
                                            value={addForm.membership_no} 
                                            onChange={e => setAddForm({...addForm, membership_no: e.target.value.toUpperCase()})} 
                                            className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none bg-slate-50 font-mono font-black text-slate-800" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Joining Date</label>
                                        <input 
                                            type="date"
                                            required
                                            value={addForm.joining_date} 
                                            onChange={e => setAddForm({...addForm, joining_date: e.target.value})} 
                                            className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none text-slate-700" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Status</label>
                                        <select 
                                            value={addForm.status} 
                                            onChange={e => setAddForm({...addForm, status: e.target.value as any})}
                                            className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none bg-white font-bold text-slate-700 cursor-pointer"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                            <option value="Suspended">Suspended</option>
                                            <option value="Expired">Expired</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Referred By & Internal Notes */}
                            <div className="space-y-3 border-t border-slate-100 pt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Referred By (Optional)</label>
                                        <input 
                                            value={addForm.referred_by} 
                                            onChange={e => setAddForm({...addForm, referred_by: e.target.value})} 
                                            placeholder="Name of the person who referred them"
                                            className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Expiry Date (Optional)</label>
                                        <input 
                                            type="date"
                                            value={addForm.expiry_date} 
                                            onChange={e => setAddForm({...addForm, expiry_date: e.target.value})} 
                                            className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none text-slate-700" 
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Internal Notes</label>
                                        <textarea 
                                            rows={2} 
                                            value={addForm.notes} 
                                            onChange={e => setAddForm({...addForm, notes: e.target.value})} 
                                            placeholder="Add any additional context or member background..."
                                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none resize-none" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={saving} 
                                className="w-full h-11 bg-primary text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-primary-light transition disabled:opacity-60 shadow-sm"
                            >
                                <span className="material-symbols-outlined text-lg">check_circle</span>
                                {saving ? 'Registering Member...' : 'Register Club Member'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
                MODAL: MANAGE CLUBS & CHAPTERS (DYNAMIC ADD / REMOVE)
               ══════════════════════════════════════════════════════════════════════════ */}
            {isManagingClubs && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden my-8 text-left animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-primary to-primary-light px-6 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-2xl">account_tree</span>
                                <div>
                                    <h2 className="text-base font-black">Manage Clubs & Chapters</h2>
                                    <p className="text-[11px] text-white/70">Create, configure and organize networking clubs</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsManagingClubs(false)} 
                                className="size-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex border-b border-slate-100 bg-slate-50/70 px-6 pt-2">
                            <button
                                onClick={() => setActiveManageTab('clubs')}
                                className={`px-4 py-2.5 text-xs font-black border-b-2 transition flex items-center gap-1.5 ${
                                    activeManageTab === 'clubs'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <span className="material-symbols-outlined text-sm">shield</span>
                                Manage Clubs ({allClubsList.length})
                            </button>
                            <button
                                onClick={() => setActiveManageTab('chapters')}
                                className={`px-4 py-2.5 text-xs font-black border-b-2 transition flex items-center gap-1.5 ${
                                    activeManageTab === 'chapters'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <span className="material-symbols-outlined text-sm">location_city</span>
                                Manage Chapters ({chapters.length})
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6 scrollbar-thin">
                            {activeManageTab === 'clubs' ? (
                                <div className="space-y-5">
                                    {/* Add Club Form */}
                                    <form onSubmit={handleAddNewClub} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                                        <p className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-base text-primary">add_circle</span> Add New Club
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Club Name *</label>
                                                <input 
                                                    required
                                                    value={newClubForm.name} 
                                                    onChange={e => setNewClubForm({ ...newClubForm, name: e.target.value })}
                                                    placeholder="e.g. Lions Club, BNI Elite"
                                                    className="w-full h-9 border border-slate-200 rounded-xl px-3 text-xs bg-white outline-none font-semibold"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Code / Prefix</label>
                                                <input 
                                                    value={newClubForm.code} 
                                                    onChange={e => setNewClubForm({ ...newClubForm, code: e.target.value.toUpperCase() })}
                                                    placeholder="e.g. LIO, BNE"
                                                    maxLength={4}
                                                    className="w-full h-9 border border-slate-200 rounded-xl px-3 text-xs bg-white outline-none font-bold"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Description (Optional)</label>
                                                <input 
                                                    value={newClubForm.description} 
                                                    onChange={e => setNewClubForm({ ...newClubForm, description: e.target.value })}
                                                    placeholder="Brief description of the club organization"
                                                    className="w-full h-9 border border-slate-200 rounded-xl px-3 text-xs bg-white outline-none"
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={saving}
                                            className="h-9 px-4 bg-primary text-white font-bold rounded-xl text-xs flex items-center gap-1 hover:bg-primary-light transition"
                                        >
                                            <span className="material-symbols-outlined text-sm">add</span> Create Club
                                        </button>
                                    </form>

                                    {/* Existing Clubs List */}
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configured Clubs</p>
                                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                                            {allClubsList.map((c: any) => {
                                                const memberCount = clubMembers.filter(m => (m.club_name || 'GBN Club').toLowerCase() === c.name.toLowerCase()).length;
                                                return (
                                                    <div key={c.name} className="p-3.5 flex items-center justify-between bg-white hover:bg-slate-50 transition">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                                {c.code || c.name.slice(0, 3)}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-800">{c.name}</p>
                                                                <p className="text-[10px] text-slate-400">{memberCount} Registered Members</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                                                            Active
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {/* Add Chapter Form */}
                                    <form onSubmit={handleAddNewChapter} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                                        <p className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-base text-primary">add_location_alt</span> Add New Chapter
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Parent Club *</label>
                                                <select 
                                                    value={newChapterForm.club_name} 
                                                    onChange={e => setNewChapterForm({ ...newChapterForm, club_name: e.target.value })}
                                                    className="w-full h-9 border border-slate-200 rounded-xl px-3 text-xs bg-white outline-none font-bold text-slate-700"
                                                >
                                                    {allClubsList.map(c => (
                                                        <option key={c.name} value={c.name}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Chapter Name *</label>
                                                <input 
                                                    required
                                                    value={newChapterForm.name} 
                                                    onChange={e => setNewChapterForm({ ...newChapterForm, name: e.target.value })}
                                                    placeholder="e.g. Varsha, Megha, Bavada"
                                                    className="w-full h-9 border border-slate-200 rounded-xl px-3 text-xs bg-white outline-none font-semibold"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">City / Region</label>
                                                <input 
                                                    value={newChapterForm.city} 
                                                    onChange={e => setNewChapterForm({ ...newChapterForm, city: e.target.value })}
                                                    placeholder="e.g. Kolhapur, Sangli"
                                                    className="w-full h-9 border border-slate-200 rounded-xl px-3 text-xs bg-white outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Weekly Meeting Day</label>
                                                <select 
                                                    value={newChapterForm.meeting_day} 
                                                    onChange={e => setNewChapterForm({ ...newChapterForm, meeting_day: e.target.value })}
                                                    className="w-full h-9 border border-slate-200 rounded-xl px-3 text-xs bg-white outline-none text-slate-700"
                                                >
                                                    <option value="Monday">Monday</option>
                                                    <option value="Tuesday">Tuesday</option>
                                                    <option value="Wednesday">Wednesday</option>
                                                    <option value="Thursday">Thursday</option>
                                                    <option value="Friday">Friday</option>
                                                    <option value="Saturday">Saturday</option>
                                                    <option value="Sunday">Sunday</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={saving}
                                            className="h-9 px-4 bg-primary text-white font-bold rounded-xl text-xs flex items-center gap-1 hover:bg-primary-light transition"
                                        >
                                            <span className="material-symbols-outlined text-sm">add</span> Create Chapter
                                        </button>
                                    </form>

                                    {/* Existing Chapters List */}
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configured Chapters</p>
                                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                                            {chapters.length === 0 ? (
                                                <p className="p-4 text-xs text-slate-400 italic text-center">No chapters found. Add your first chapter above.</p>
                                            ) : (
                                                chapters.map((ch: any) => {
                                                    const count = clubMembers.filter(m => (m.chapter_name || '').toLowerCase() === ch.name.toLowerCase()).length;
                                                    return (
                                                        <div key={ch.id || ch.name} className="p-3.5 flex items-center justify-between bg-white hover:bg-slate-50 transition">
                                                            <div className="flex items-center gap-3">
                                                                <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                                    <span className="material-symbols-outlined text-sm">location_on</span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-slate-800">{ch.name}</p>
                                                                    <p className="text-[10px] text-slate-400">{ch.club_name} • {ch.city || 'Kolhapur'} ({ch.meeting_day || 'Wednesday'})</p>
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                                                                {count} Members
                                                            </span>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
                MODAL: 360° MEMBER PROFILE & NETWORKING HUB (ULTRA-WIDE LUXURY UX)
               ══════════════════════════════════════════════════════════════════════════ */}
            {detail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-hidden" onClick={() => setDetail(null)}>
                    <div 
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] max-h-[850px] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-slate-100" 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* ─── Luxury Gradient Header ─── */}
                        <div className="bg-gradient-to-r from-slate-950 via-[#0C1938] to-[#122B5C] px-6 py-5 text-white relative shrink-0 border-b border-white/10 shadow-lg">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="size-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-primary-light to-white p-0.5 shadow-md shrink-0">
                                        <div className="size-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white text-2xl font-black">
                                            {detail.full_name?.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">{detail.full_name}</h2>
                                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${getStatusBadge(detail.status)}`}>
                                                {detail.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/70 text-xs font-semibold mt-1 flex-wrap">
                                            <span className="font-mono bg-white/10 px-2 py-0.5 rounded-md text-white/90">{detail.membership_no}</span>
                                            <span>•</span>
                                            <span className="text-amber-300 font-bold">{detail.club_name || 'GBN Club'}</span>
                                            <span>•</span>
                                            <span className="text-sky-300">{detail.chapter_name || 'Megha Chapter'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Direct Actions in Header */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <a 
                                        href={`tel:${detail.phone}`} 
                                        className="h-9 px-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-base">call</span> Call
                                    </a>
                                    <a 
                                        href={toWhatsAppUrl(detail.whatsapp_number || detail.phone)} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="h-9 px-3.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-base">chat</span> WhatsApp
                                    </a>
                                    <button 
                                        onClick={() => setActiveDetailTab('settings')} 
                                        className="h-9 px-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition border border-white/15" 
                                        title="Edit Profile"
                                    >
                                        <span className="material-symbols-outlined text-sm">edit</span> Edit
                                    </button>
                                    <button 
                                        onClick={() => setDetail(null)} 
                                        className="size-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition border border-white/15"
                                        title="Close"
                                    >
                                        <span className="material-symbols-outlined text-base">close</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ─── Modern Pill Navigation Tabs ─── */}
                        <div className="bg-slate-100/80 px-6 py-2.5 shrink-0 border-b border-slate-200/80">
                            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                                {[
                                    { id: 'overview', label: 'Overview', icon: 'badge', count: null },
                                    { id: 'attendance', label: 'Attendance', icon: 'event_available', count: memberMetricsMap[detail.id]?.attendanceTotal || 0 },
                                    { id: 'presentations', label: 'Presentations', icon: 'co_present', count: memberMetricsMap[detail.id]?.presentations || 0 },
                                    { id: 'onetoone', label: '1-to-1 Meetings', icon: 'handshake', count: memberMetricsMap[detail.id]?.oneToOne || 0 },
                                    { id: 'onetomany', label: '1-to-Many', icon: 'groups', count: memberMetricsMap[detail.id]?.oneToManyHosted || 0 },
                                    { id: 'referrals', label: 'Referrals & Deals', icon: 'payments', count: memberMetricsMap[detail.id]?.businessVolume ? formatCurrency(memberMetricsMap[detail.id]?.businessVolume) : null },
                                    { id: 'ledger', label: 'Service Barter', icon: 'swap_horiz', count: (memberMetricsMap[detail.id]?.servicesTaken || 0) + (memberMetricsMap[detail.id]?.servicesGiven || 0) },
                                    { id: 'settings', label: 'Settings', icon: 'manage_accounts', count: null },
                                ].map(tab => {
                                    const isActive = activeDetailTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveDetailTab(tab.id as any)}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                                                isActive
                                                    ? 'bg-primary text-white shadow-sm ring-1 ring-primary/20'
                                                    : 'bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/70'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-base">{tab.icon}</span>
                                            <span>{tab.label}</span>
                                            {tab.count !== null && (
                                                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                                                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {tab.count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ─── Modal Scrollable Body ─── */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 text-left scrollbar-thin">
                            
                            {/* ══════════════════════════════════════════════════════════════
                                TAB 1: 360° EXECUTIVE OVERVIEW (PRO 2-COLUMN SPLIT)
                               ══════════════════════════════════════════════════════════════ */}
                            {activeDetailTab === 'overview' && (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                    {/* Left Column (5/12): Digital Loyalty Card, Contact & Addresses */}
                                    <div className="lg:col-span-5 space-y-5">
                                        {/* Luxury Metallic VIP Loyalty Card */}
                                        <div className="bg-gradient-to-br from-slate-950 via-[#101C38] to-[#1E2E54] p-5 rounded-3xl text-white shadow-xl relative overflow-hidden border border-white/10">
                                            {/* Watermark Icon */}
                                            <span className="material-symbols-outlined absolute -right-4 -bottom-6 text-[150px] text-white/5 pointer-events-none select-none font-thin">
                                                workspace_premium
                                            </span>

                                            {/* Card Top */}
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="size-2 rounded-full bg-amber-400 animate-pulse"></span>
                                                        <p className="text-[9px] font-bold text-amber-300 uppercase tracking-widest">
                                                            {detail.club_name || 'GBN CLUB'} MEMBER CARD
                                                        </p>
                                                    </div>
                                                    <p className="text-base font-black tracking-wide mt-1.5">{detail.full_name}</p>
                                                    <p className="text-[11px] text-slate-300 font-mono mt-0.5 tracking-wider">{detail.membership_no}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="inline-block text-[10px] font-black bg-white/15 text-white px-2.5 py-1 rounded-xl border border-white/20 backdrop-blur-sm">
                                                        {detail.chapter_name || 'Megha Chapter'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Card Bottom / Live Metrics */}
                                            <div className="mt-7 pt-4 border-t border-white/10 flex justify-between items-end">
                                                <div>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">NETWORKING SCORE</p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                            📅 {(memberMetricsMap[detail.id]?.attendanceTotal) || 0} Attended
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                            🤝 {(memberMetricsMap[detail.id]?.oneToOne) || 0} 1-to-1s
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">MEMBER SINCE</p>
                                                    <p className="text-xs font-bold text-white mt-0.5">{formatDate(detail.joining_date)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contact Directory Card */}
                                        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-3">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[16px] text-primary">contacts</span> Direct Contact Info
                                            </p>
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                    <span className="font-bold text-slate-400 block uppercase tracking-wide text-[9px]">Mobile Phone</span>
                                                    <a href={`tel:${detail.phone}`} className="font-bold text-primary hover:underline block mt-0.5">
                                                        {detail.phone}
                                                    </a>
                                                </div>
                                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                    <span className="font-bold text-slate-400 block uppercase tracking-wide text-[9px]">WhatsApp</span>
                                                    <span className="font-bold text-emerald-700 block mt-0.5 truncate">
                                                        {detail.whatsapp_number || detail.phone}
                                                    </span>
                                                </div>
                                                {detail.alternate_phone && (
                                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                        <span className="font-bold text-slate-400 block uppercase tracking-wide text-[9px]">Alternate Phone</span>
                                                        <span className="font-semibold text-slate-700 block mt-0.5">{detail.alternate_phone}</span>
                                                    </div>
                                                )}
                                                {detail.email && (
                                                    <div className="col-span-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                        <span className="font-bold text-slate-400 block uppercase tracking-wide text-[9px]">Email Address</span>
                                                        <a href={`mailto:${detail.email}`} className="font-semibold text-slate-800 hover:text-primary truncate block mt-0.5">
                                                            {detail.email}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Addresses */}
                                        {(detail.home_address || detail.business_address) && (
                                            <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-3">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[16px] text-primary">location_on</span> Location Addresses
                                                </p>
                                                <div className="space-y-2.5 text-xs">
                                                    {detail.home_address && (
                                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                            <span className="font-bold text-slate-500 block uppercase tracking-wide text-[9px] flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-xs text-primary">home</span> Residential Address
                                                            </span>
                                                            <span className="font-semibold text-slate-800 block mt-1 leading-relaxed">{detail.home_address}</span>
                                                        </div>
                                                    )}
                                                    {detail.business_address && (
                                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                            <span className="font-bold text-slate-500 block uppercase tracking-wide text-[9px] flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-xs text-primary">apartment</span> Office Address
                                                            </span>
                                                            <span className="font-semibold text-slate-800 block mt-1 leading-relaxed">{detail.business_address}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column (7/12): Business Profile, Scorecard Tiles, Notes */}
                                    <div className="lg:col-span-7 space-y-5">
                                        {/* Executive Scorecard Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Meetings</p>
                                                <p className="text-xl font-black text-blue-700 mt-0.5">
                                                    {memberMetricsMap[detail.id]?.attendanceTotal || 0}
                                                </p>
                                                <p className="text-[9px] text-slate-400 mt-0.5">
                                                    🏠 {memberMetricsMap[detail.id]?.homeAttendance || 0} | 🌐 {memberMetricsMap[detail.id]?.crossAttendance || 0}
                                                </p>
                                            </div>

                                            <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Presentations</p>
                                                <p className="text-xl font-black text-indigo-600 mt-0.5">
                                                    {memberMetricsMap[detail.id]?.presentations || 0}
                                                </p>
                                                <p className="text-[9px] text-slate-400 mt-0.5">Feature & Pitches</p>
                                            </div>

                                            <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">1-to-1s</p>
                                                <p className="text-xl font-black text-purple-700 mt-0.5">
                                                    {memberMetricsMap[detail.id]?.oneToOne || 0}
                                                </p>
                                                <p className="text-[9px] text-slate-400 mt-0.5">Peer Meetings</p>
                                            </div>

                                            <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Done Deals</p>
                                                <p className="text-base font-black text-emerald-600 mt-0.5 truncate">
                                                    {formatCurrency(memberMetricsMap[detail.id]?.businessVolume || 0)}
                                                </p>
                                                <p className="text-[9px] text-slate-400 mt-0.5">Business Volume</p>
                                            </div>
                                        </div>

                                        {/* Business Profile & Services */}
                                        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-3.5">
                                            <div className="flex justify-between items-center">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[16px] text-primary">storefront</span> Business Profile
                                                </p>
                                                {detail.business_category && (
                                                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                                                        {detail.business_category}
                                                    </span>
                                                )}
                                            </div>

                                            {detail.business_name ? (
                                                <div className="space-y-3">
                                                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                                                        <h3 className="text-base font-black text-slate-900">{detail.business_name}</h3>
                                                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                                                            {detail.business_type || detail.business_category || 'Commercial Entity'}
                                                        </p>
                                                    </div>

                                                    {detail.business_services && (
                                                        <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed">
                                                            <p className="font-black text-amber-800 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-sm">handyman</span> Services Provided & Solutions
                                                            </p>
                                                            <p className="whitespace-pre-line text-slate-800 font-medium">{detail.business_services}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="bg-slate-50 rounded-xl p-6 text-center text-xs text-slate-400 italic border border-dashed border-slate-200">
                                                    No business profile details registered for this member yet.
                                                </div>
                                            )}
                                        </div>

                                        {/* Notes & Referral Details */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Referred By</p>
                                                <p className="text-xs font-black text-slate-800 mt-1">{detail.referred_by || 'Direct / Organic'}</p>
                                            </div>
                                            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Spend in Dealership</p>
                                                <p className="text-xs font-black text-slate-800 mt-1">{formatCurrency(detail.total_spent || 0)}</p>
                                            </div>
                                        </div>

                                        {detail.notes && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
                                                <p className="text-[9px] font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs">notes</span> Membership Notes
                                                </p>
                                                <p className="text-xs text-amber-950 leading-relaxed whitespace-pre-line font-medium">{detail.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ══════════════════════════════════════════════════════════════
                                TAB 2: ATTENDANCE & MEETINGS
                               ══════════════════════════════════════════════════════════════ */}
                            {activeDetailTab === 'attendance' && (
                                <div className="space-y-6">
                                    {/* Attendance KPI Cards */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-sm">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Attended</p>
                                            <p className="text-2xl font-black text-slate-900 mt-1">
                                                {memberMetricsMap[detail.id]?.attendanceTotal || 0}
                                            </p>
                                        </div>
                                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-sm">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Home Chapter</p>
                                            <p className="text-2xl font-black text-emerald-600 mt-1">
                                                {memberMetricsMap[detail.id]?.homeAttendance || 0}
                                            </p>
                                        </div>
                                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-sm">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Cross Chapter</p>
                                            <p className="text-2xl font-black text-blue-600 mt-1">
                                                {memberMetricsMap[detail.id]?.crossAttendance || 0}
                                            </p>
                                        </div>
                                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-sm">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Last Attended</p>
                                            <p className="text-xs font-black text-slate-700 mt-2">
                                                {memberMetricsMap[detail.id]?.lastAttended ? formatDate(memberMetricsMap[detail.id]?.lastAttended!) : 'Never'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Record Attendance Form */}
                                    <form onSubmit={handleLogAttendance} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-base text-primary">event_available</span> Log Meeting Attendance
                                            </p>
                                            <span className="text-[10px] text-slate-400 font-bold">Quick record meeting participation</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Meeting Date *</label>
                                                <input 
                                                    type="date"
                                                    required
                                                    value={attendanceForm.meeting_date} 
                                                    onChange={e => setAttendanceForm({ ...attendanceForm, meeting_date: e.target.value })}
                                                    className="w-full h-9 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-primary/10"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Attendance Status</label>
                                                <select 
                                                    value={attendanceForm.status} 
                                                    onChange={e => setAttendanceForm({ ...attendanceForm, status: e.target.value as any })}
                                                    className="w-full h-9 border border-slate-200 rounded-xl px-2.5 text-xs outline-none bg-white font-bold text-slate-700 cursor-pointer"
                                                >
                                                    <option value="Present">Present</option>
                                                    <option value="Absent">Absent</option>
                                                    <option value="Substitute">Substitute Sent</option>
                                                    <option value="Late">Late</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Chapter Name</label>
                                                <input 
                                                    value={attendanceForm.chapter_name} 
                                                    onChange={e => setAttendanceForm({ ...attendanceForm, chapter_name: e.target.value })}
                                                    placeholder="e.g. Varsha Chapter"
                                                    className="w-full h-9 border border-slate-200 rounded-xl px-3 text-xs outline-none"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 pt-3">
                                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                                    <input 
                                                        type="checkbox"
                                                        checked={attendanceForm.is_home_chapter}
                                                        onChange={e => setAttendanceForm({ ...attendanceForm, is_home_chapter: e.target.checked })}
                                                        className="size-4 rounded text-primary focus:ring-primary/20"
                                                    />
                                                    Home Chapter Meeting
                                                </label>
                                            </div>
                                            {attendanceForm.status === 'Substitute' && (
                                                <div className="sm:col-span-2">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Substitute Person Name</label>
                                                    <input 
                                                        value={attendanceForm.substitute_name} 
                                                        onChange={e => setAttendanceForm({ ...attendanceForm, substitute_name: e.target.value })}
                                                        placeholder="Name of substitute who attended"
                                                        className="w-full h-9 border border-slate-200 rounded-xl px-3 text-xs outline-none"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={saving}
                                            className="h-10 px-5 bg-primary text-white font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-primary-light transition shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-base">check</span> Save Attendance
                                        </button>
                                    </form>

                                    {/* Attendance Logs List */}
                                    <div className="space-y-3">
                                        <p className="text-xs font-black text-slate-600 uppercase tracking-wider">Attendance Logs</p>
                                        <div className="space-y-2 max-h-[320px] overflow-y-auto scrollbar-thin">
                                            {localAttendance.filter(a => a.member_id === detail.id).length === 0 ? (
                                                <p className="text-xs text-slate-400 italic py-6 text-center bg-white rounded-2xl border border-slate-100">
                                                    No attendance records logged yet for this member.
                                                </p>
                                            ) : (
                                                localAttendance.filter(a => a.member_id === detail.id).map(a => (
                                                    <div key={a.id} className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-sm flex items-center justify-between hover:bg-slate-50 transition">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`size-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                                                                a.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                                                            }`}>
                                                                {a.status === 'Present' ? '✓' : '✕'}
                                                            </span>
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-900">{formatDate(a.meeting_date)}</p>
                                                                <p className="text-[11px] text-slate-400">
                                                                    {a.chapter_name} • {a.is_home_chapter ? '🏠 Home Chapter' : '🌐 Cross Chapter Visitor'}
                                                                    {a.substitute_name ? ` (Sub: ${a.substitute_name})` : ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                                                            a.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                                                        }`}>
                                                            {a.status}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ══════════════════════════════════════════════════════════════
                                TAB 3: FEATURE PRESENTATIONS
                               ══════════════════════════════════════════════════════════════ */}
                            {activeDetailTab === 'presentations' && (
                                <div className="space-y-6">
                                    {/* Log Presentation Form */}
                                    <form onSubmit={handleLogPresentation} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                                        <p className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-base text-primary">co_present</span> Log Member Presentation
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            <div className="sm:col-span-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Presentation Topic / Title *</label>
                                                <input 
                                                    required
                                                    value={presentationForm.topic} 
                                                    onChange={e => setPresentationForm({ ...presentationForm, topic: e.target.value })}
                                                    placeholder="e.g. 8-Min Feature: Car Exchange & Loan Solutions for Corporates"
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none font-semibold"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Date *</label>
                                                <input 
                                                    type="date"
                                                    required
                                                    value={presentationForm.presentation_date} 
                                                    onChange={e => setPresentationForm({ ...presentationForm, presentation_date: e.target.value })}
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Presentation Format</label>
                                                <select 
                                                    value={presentationForm.presentation_type} 
                                                    onChange={e => setPresentationForm({ ...presentationForm, presentation_type: e.target.value as any })}
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-2.5 text-xs outline-none bg-white font-bold text-slate-700"
                                                >
                                                    <option value="Feature">Feature Presentation (8-Min)</option>
                                                    <option value="30_Second">30-Second Pitch</option>
                                                    <option value="Showcase">Product / Service Showcase</option>
                                                    <option value="Other">Other Presentation</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Chapter Given In</label>
                                                <input 
                                                    value={presentationForm.chapter_name} 
                                                    onChange={e => setPresentationForm({ ...presentationForm, chapter_name: e.target.value })}
                                                    placeholder="e.g. Varsha Chapter"
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 pt-3">
                                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                                    <input 
                                                        type="checkbox"
                                                        checked={presentationForm.is_cross_chapter}
                                                        onChange={e => setPresentationForm({ ...presentationForm, is_cross_chapter: e.target.checked })}
                                                        className="size-4 rounded text-primary focus:ring-primary/20"
                                                    />
                                                    Cross Chapter Presentation
                                                </label>
                                            </div>
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={saving}
                                            className="h-10 px-5 bg-primary text-white font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-primary-light transition shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-base">add</span> Save Presentation
                                        </button>
                                    </form>

                                    {/* Presentations Timeline */}
                                    <div className="space-y-3">
                                        <p className="text-xs font-black text-slate-600 uppercase tracking-wider">Presentations History</p>
                                        <div className="space-y-2.5 max-h-[320px] overflow-y-auto scrollbar-thin">
                                            {clubPresentations.filter(p => p.member_id === detail.id).length === 0 ? (
                                                <p className="text-xs text-slate-400 italic py-6 text-center bg-white rounded-2xl border border-slate-100">
                                                    No presentations recorded yet.
                                                </p>
                                            ) : (
                                                clubPresentations.filter(p => p.member_id === detail.id).map(p => (
                                                    <div key={p.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1.5 hover:bg-slate-50 transition">
                                                        <div className="flex justify-between items-start gap-2">
                                                            <p className="text-xs font-black text-slate-900">{p.topic}</p>
                                                            <span className="text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full shrink-0">
                                                                {p.presentation_type}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 font-medium">
                                                            {formatDate(p.presentation_date)} • {p.chapter_name} {p.is_cross_chapter ? '(🌐 Cross-Chapter)' : '(🏠 Home Chapter)'}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ══════════════════════════════════════════════════════════════
                                TAB 4: 1-TO-1 MEETINGS ("WHO TO WHOM")
                               ══════════════════════════════════════════════════════════════ */}
                            {activeDetailTab === 'onetoone' && (
                                <div className="space-y-6">
                                    {/* Log 1-to-1 Form */}
                                    <form onSubmit={handleLogOneToOne} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                                        <p className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-base text-primary">handshake</span> Record 1-to-1 Meeting ("Who to Whom")
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Meeting Conducted With *</label>
                                                <select 
                                                    value={oneToOneForm.with_member_id} 
                                                    onChange={e => setOneToOneForm({ ...oneToOneForm, with_member_id: e.target.value, with_member_name: '' })}
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none bg-white font-bold text-slate-700"
                                                >
                                                    <option value="">-- Select Member from Directory --</option>
                                                    {clubMembers.filter(m => m.id !== detail.id).map(m => (
                                                        <option key={m.id} value={m.id}>
                                                            {m.full_name} ({m.business_name || m.chapter_name || 'Member'})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Or Enter Custom Name / External Member</label>
                                                <input 
                                                    value={oneToOneForm.with_member_name} 
                                                    onChange={e => setOneToOneForm({ ...oneToOneForm, with_member_name: e.target.value, with_member_id: '' })}
                                                    placeholder="Member Name"
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Meeting Date *</label>
                                                <input 
                                                    type="date"
                                                    required
                                                    value={oneToOneForm.meeting_date} 
                                                    onChange={e => setOneToOneForm({ ...oneToOneForm, meeting_date: e.target.value })}
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Location / Mode</label>
                                                <input 
                                                    value={oneToOneForm.location} 
                                                    onChange={e => setOneToOneForm({ ...oneToOneForm, location: e.target.value })}
                                                    placeholder="e.g. Office, Cafe, Zoom"
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Discussion Topics & Business Synergies</label>
                                                <textarea 
                                                    rows={2}
                                                    value={oneToOneForm.discussion_topics} 
                                                    onChange={e => setOneToOneForm({ ...oneToOneForm, discussion_topics: e.target.value })}
                                                    placeholder="Discussion points, referral criteria, target client exchange..."
                                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none resize-none"
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={saving}
                                            className="h-10 px-5 bg-primary text-white font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-primary-light transition shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-base">check</span> Save 1-to-1 Meeting
                                        </button>
                                    </form>

                                    {/* 1-to-1 Meetings History */}
                                    <div className="space-y-3">
                                        <p className="text-xs font-black text-slate-600 uppercase tracking-wider">1-to-1 Meetings Log</p>
                                        <div className="space-y-2.5 max-h-[320px] overflow-y-auto scrollbar-thin">
                                            {clubOneToOne.filter(o => o.initiator_member_id === detail.id || o.with_member_id === detail.id).length === 0 ? (
                                                <p className="text-xs text-slate-400 italic py-6 text-center bg-white rounded-2xl border border-slate-100">
                                                    No 1-to-1 meetings recorded yet.
                                                </p>
                                            ) : (
                                                clubOneToOne.filter(o => o.initiator_member_id === detail.id || o.with_member_id === detail.id).map(o => (
                                                    <div key={o.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1.5 hover:bg-slate-50 transition">
                                                        <div className="flex justify-between items-start">
                                                            <p className="text-xs font-black text-slate-900">
                                                                1-to-1 with <span className="text-primary">{o.with_member_name}</span>
                                                            </p>
                                                            <span className="text-[10px] text-slate-400 font-bold">{formatDate(o.meeting_date)}</span>
                                                        </div>
                                                        {o.location && <p className="text-[11px] text-slate-500 font-medium">📍 {o.location}</p>}
                                                        {o.discussion_topics && (
                                                            <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1 leading-relaxed">
                                                                {o.discussion_topics}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ══════════════════════════════════════════════════════════════
                                TAB 5: 1-TO-MANY SESSIONS (HOST & ATTENDEE CHECKMARKS)
                               ══════════════════════════════════════════════════════════════ */}
                            {activeDetailTab === 'onetomany' && (
                                <div className="space-y-6">
                                    {/* Host 1-to-Many Form */}
                                    <form onSubmit={handleLogOneToMany} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                                        <p className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-base text-primary">groups</span> Host 1-to-Many Session (with Attendee Checkmarks ✅)
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            <div className="sm:col-span-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Session Title / Topic *</label>
                                                <input 
                                                    required
                                                    value={oneToManyForm.title} 
                                                    onChange={e => setOneToManyForm({ ...oneToManyForm, title: e.target.value })}
                                                    placeholder="e.g. Power Cluster Automotive Meet, Interactive Workshop"
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none font-semibold"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Date *</label>
                                                <input 
                                                    type="date"
                                                    required
                                                    value={oneToManyForm.meeting_date} 
                                                    onChange={e => setOneToManyForm({ ...oneToManyForm, meeting_date: e.target.value })}
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Venue / Mode</label>
                                                <input 
                                                    value={oneToManyForm.location_or_mode} 
                                                    onChange={e => setOneToManyForm({ ...oneToManyForm, location_or_mode: e.target.value })}
                                                    placeholder="e.g. Conference Hall, Zoom"
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none"
                                                />
                                            </div>

                                            {/* Attendee Checklist with Search */}
                                            <div className="sm:col-span-2 space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                                                        Select Members who attended ({oneToManyForm.attendee_ids.length} selected)
                                                    </label>
                                                    <input 
                                                        value={oneToManySearch}
                                                        onChange={e => setOneToManySearch(e.target.value)}
                                                        placeholder="Filter members..."
                                                        className="h-7 border border-slate-200 rounded-lg px-2 text-[11px] outline-none w-36"
                                                    />
                                                </div>

                                                <div className="border border-slate-200 rounded-2xl p-3 max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-slate-50/50 scrollbar-thin">
                                                    {clubMembers
                                                        .filter(m => m.id !== detail.id)
                                                        .filter(m => !oneToManySearch || m.full_name?.toLowerCase().includes(oneToManySearch.toLowerCase()))
                                                        .map(m => {
                                                            const isChecked = oneToManyForm.attendee_ids.includes(m.id);
                                                            return (
                                                                <label 
                                                                    key={m.id} 
                                                                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition shadow-sm ${
                                                                        isChecked 
                                                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold ring-1 ring-emerald-200' 
                                                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                                                    }`}
                                                                >
                                                                    <input 
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) {
                                                                                setOneToManyForm({
                                                                                    ...oneToManyForm,
                                                                                    attendee_ids: [...oneToManyForm.attendee_ids, m.id]
                                                                                });
                                                                            } else {
                                                                                setOneToManyForm({
                                                                                    ...oneToManyForm,
                                                                                    attendee_ids: oneToManyForm.attendee_ids.filter(id => id !== m.id)
                                                                                });
                                                                            }
                                                                        }}
                                                                        className="size-4 rounded text-emerald-600 focus:ring-emerald-200"
                                                                    />
                                                                    <span className="truncate">{m.full_name}</span>
                                                                </label>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={saving}
                                            className="h-10 px-5 bg-primary text-white font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-primary-light transition shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-base">add</span> Save 1-to-Many Session
                                        </button>
                                    </form>

                                    {/* Sessions Log */}
                                    <div className="space-y-3">
                                        <p className="text-xs font-black text-slate-600 uppercase tracking-wider">1-to-Many Sessions Log</p>
                                        <div className="space-y-3 max-h-[320px] overflow-y-auto scrollbar-thin">
                                            {clubOneToMany.filter(om => om.host_member_id === detail.id || (Array.isArray(om.attendee_ids) && om.attendee_ids.includes(detail.id))).length === 0 ? (
                                                <p className="text-xs text-slate-400 italic py-6 text-center bg-white rounded-2xl border border-slate-100">
                                                    No 1-to-many sessions recorded.
                                                </p>
                                            ) : (
                                                clubOneToMany.filter(om => om.host_member_id === detail.id || (Array.isArray(om.attendee_ids) && om.attendee_ids.includes(detail.id))).map(om => (
                                                    <div key={om.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2 hover:bg-slate-50 transition">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="text-xs font-black text-slate-900">{om.title}</p>
                                                                <p className="text-[11px] text-slate-400">
                                                                    Host: <span className="font-bold text-slate-700">{om.host_name}</span> • {formatDate(om.meeting_date)}
                                                                </p>
                                                            </div>
                                                            <span className="text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full">
                                                                {om.attendee_count} Attendees
                                                            </span>
                                                        </div>
                                                        {Array.isArray(om.attendee_names) && om.attendee_names.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {om.attendee_names.map((name: string, idx: number) => (
                                                                    <span key={idx} className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                                                        ✓ {name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ══════════════════════════════════════════════════════════════
                                TAB 6: REFERRALS & BUSINESS DEALS (DONE DEALS)
                               ══════════════════════════════════════════════════════════════ */}
                            {activeDetailTab === 'referrals' && (
                                <div className="space-y-6">
                                    {/* Done Deal / Business Volume Form */}
                                    <form onSubmit={handleLogBusinessDeal} className="bg-gradient-to-br from-emerald-50/90 to-teal-50/50 border border-emerald-200 rounded-2xl p-5 shadow-sm space-y-4">
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-base text-emerald-600">monetization_on</span> Record Done Deal (Closed Business Volume)
                                            </p>
                                            <span className="text-xs font-black text-emerald-700">
                                                Total: {formatCurrency(memberMetricsMap[detail.id]?.businessVolume || 0)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Amount (₹) *</label>
                                                <input 
                                                    type="number"
                                                    step="0.01"
                                                    required
                                                    value={businessDealForm.amount} 
                                                    onChange={e => setBusinessDealForm({ ...businessDealForm, amount: e.target.value })}
                                                    placeholder="e.g. 50000"
                                                    className="w-full h-10 border border-emerald-300 rounded-xl px-3 text-xs bg-white outline-none font-black text-emerald-800"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Deal Type</label>
                                                <select 
                                                    value={businessDealForm.deal_type} 
                                                    onChange={e => setBusinessDealForm({ ...businessDealForm, deal_type: e.target.value as any })}
                                                    className="w-full h-10 border border-emerald-300 rounded-xl px-2.5 text-xs bg-white outline-none font-bold text-slate-700"
                                                >
                                                    <option value="New_Business">New Business</option>
                                                    <option value="Repeat_Business">Repeat Business</option>
                                                    <option value="Tier_3_Referral">Tier-3 Referral Business</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Business Given By (Member)</label>
                                                <select 
                                                    value={businessDealForm.given_by_member_id} 
                                                    onChange={e => setBusinessDealForm({ ...businessDealForm, given_by_member_id: e.target.value })}
                                                    className="w-full h-10 border border-emerald-300 rounded-xl px-2.5 text-xs bg-white outline-none text-slate-700"
                                                >
                                                    <option value="">-- Select Member or Type Below --</option>
                                                    {clubMembers.filter(m => m.id !== detail.id).map(m => (
                                                        <option key={m.id} value={m.id}>{m.full_name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Date *</label>
                                                <input 
                                                    type="date"
                                                    required
                                                    value={businessDealForm.deal_date} 
                                                    onChange={e => setBusinessDealForm({ ...businessDealForm, deal_date: e.target.value })}
                                                    className="w-full h-10 border border-emerald-300 rounded-xl px-3 text-xs bg-white outline-none"
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={saving}
                                            className="h-10 px-5 bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-emerald-700 transition shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-base">check</span> Log Closed Deal
                                        </button>
                                    </form>

                                    {/* Referrals Given / Received Form */}
                                    <form onSubmit={handleLogReferral} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                                        <p className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-base text-primary">swap_calls</span> Log Referral (Lead Passed / Received)
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Direction</label>
                                                <select 
                                                    value={referralForm.direction} 
                                                    onChange={e => setReferralForm({ ...referralForm, direction: e.target.value as any })}
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-2.5 text-xs outline-none bg-white font-bold text-slate-700"
                                                >
                                                    <option value="given">Referral Given (Passed by Member)</option>
                                                    <option value="received">Referral Received (Given to Member)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Referral Lead Name *</label>
                                                <input 
                                                    required
                                                    value={referralForm.referral_name} 
                                                    onChange={e => setReferralForm({ ...referralForm, referral_name: e.target.value })}
                                                    placeholder="Prospect / Customer Name"
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none font-semibold"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Contact Number</label>
                                                <input 
                                                    value={referralForm.referral_phone} 
                                                    onChange={e => setReferralForm({ ...referralForm, referral_phone: e.target.value })}
                                                    placeholder="Lead phone number"
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pipeline Status</label>
                                                <select 
                                                    value={referralForm.status} 
                                                    onChange={e => setReferralForm({ ...referralForm, status: e.target.value as any })}
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-2.5 text-xs outline-none bg-white font-bold text-slate-700"
                                                >
                                                    <option value="Given">Given</option>
                                                    <option value="Contacted">Contacted</option>
                                                    <option value="In_Progress">In Progress</option>
                                                    <option value="Closed_Deal">Closed Deal</option>
                                                    <option value="Lost">Lost</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={saving}
                                            className="h-10 px-5 bg-primary text-white font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-primary-light transition shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-base">send</span> Save Referral
                                        </button>
                                    </form>

                                    {/* Done Deals Summary List */}
                                    <div className="space-y-3">
                                        <p className="text-xs font-black text-slate-600 uppercase tracking-wider">Closed Business Deals Log</p>
                                        <div className="space-y-2 max-h-[250px] overflow-y-auto scrollbar-thin">
                                            {clubBusinessDeals.filter(b => b.member_id === detail.id).length === 0 ? (
                                                <p className="text-xs text-slate-400 italic py-5 text-center bg-white rounded-2xl border border-slate-100">
                                                    No closed deals logged yet.
                                                </p>
                                            ) : (
                                                clubBusinessDeals.filter(b => b.member_id === detail.id).map(b => (
                                                    <div key={b.id} className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-sm flex items-center justify-between hover:bg-slate-50 transition">
                                                        <div>
                                                            <p className="text-xs font-black text-emerald-700">{formatCurrency(b.amount)}</p>
                                                            <p className="text-[11px] text-slate-400">
                                                                Given by: {b.given_by_name || 'Member'} • {formatDate(b.deal_date)} ({b.deal_type})
                                                            </p>
                                                        </div>
                                                        <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                                            Closed Deal
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ══════════════════════════════════════════════════════════════
                                TAB 7: SERVICE BARTER LEDGER (INBOUND & OUTBOUND)
                               ══════════════════════════════════════════════════════════════ */}
                            {activeDetailTab === 'ledger' && (
                                <div className="space-y-6">
                                    {/* Service Exchange Action Form */}
                                    <form onSubmit={handleAddTransaction} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                                        <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Record Service Exchange / Barter</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Exchange Type</label>
                                                <select 
                                                    value={txForm.exchange_type} 
                                                    onChange={e => setTxForm({...txForm, exchange_type: e.target.value as any})}
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-2.5 text-xs outline-none bg-white font-bold text-slate-700 cursor-pointer"
                                                >
                                                    <option value="taken_from_member">📥 Taken from Member (Inbound Service)</option>
                                                    <option value="given_to_member">📤 Given to Member (Outbound Service)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Equivalent Value (₹)</label>
                                                <input 
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="e.g. 1500 (Optional)"
                                                    value={txForm.equivalent_value} 
                                                    onChange={e => setTxForm({...txForm, equivalent_value: e.target.value})} 
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none font-semibold"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Service Name / Description *</label>
                                                <input 
                                                    required
                                                    placeholder="e.g. Free Wheel Alignment, Printing Banners"
                                                    value={txForm.service_name} 
                                                    onChange={e => setTxForm({...txForm, service_name: e.target.value})} 
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none"
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={saving} 
                                            className="h-10 px-5 bg-primary text-white font-bold rounded-xl text-xs flex items-center justify-center hover:bg-primary-light transition shadow-sm"
                                        >
                                            Log Service Exchange
                                        </button>
                                    </form>

                                    {/* Dual Columns for Service Barter */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Inbound */}
                                        <div className="space-y-3">
                                            <p className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                                                <span>📥</span> Services Taken from Member (Inbound)
                                            </p>
                                            <div className="space-y-2.5 max-h-[300px] overflow-y-auto scrollbar-thin">
                                                {clubTransactions.filter((tx: any) => tx.member_id === detail.id && tx.exchange_type === 'taken_from_member').length === 0 ? (
                                                    <p className="text-xs text-slate-400 italic py-4 text-center bg-white rounded-xl border border-slate-100">
                                                        No inbound services logged.
                                                    </p>
                                                ) : (
                                                    clubTransactions
                                                        .filter((tx: any) => tx.member_id === detail.id && tx.exchange_type === 'taken_from_member')
                                                        .map((tx: any) => (
                                                            <div key={tx.id} className="bg-white border-l-4 border-l-emerald-500 border border-slate-200/80 rounded-xl p-3.5 shadow-sm">
                                                                <p className="text-xs font-bold text-slate-900">{tx.service_name}</p>
                                                                <p className="text-[10px] text-slate-400 mt-1">{formatDate(tx.transaction_date)}</p>
                                                            </div>
                                                        ))
                                                )}
                                            </div>
                                        </div>

                                        {/* Outbound */}
                                        <div className="space-y-3">
                                            <p className="text-xs font-black text-blue-800 uppercase tracking-wider flex items-center gap-1">
                                                <span>📤</span> Services Given to Member (Outbound)
                                            </p>
                                            <div className="space-y-2.5 max-h-[300px] overflow-y-auto scrollbar-thin">
                                                {clubTransactions.filter((tx: any) => tx.member_id === detail.id && tx.exchange_type === 'given_to_member').length === 0 ? (
                                                    <p className="text-xs text-slate-400 italic py-4 text-center bg-white rounded-xl border border-slate-100">
                                                        No outbound services logged.
                                                    </p>
                                                ) : (
                                                    clubTransactions
                                                        .filter((tx: any) => tx.member_id === detail.id && tx.exchange_type === 'given_to_member')
                                                        .map((tx: any) => (
                                                            <div key={tx.id} className="bg-white border-l-4 border-l-blue-500 border border-slate-200/80 rounded-xl p-3.5 shadow-sm">
                                                                <p className="text-xs font-bold text-slate-900">{tx.service_name}</p>
                                                                <p className="text-[10px] text-slate-400 mt-1">{formatDate(tx.transaction_date)}</p>
                                                            </div>
                                                        ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ══════════════════════════════════════════════════════════════
                                TAB 8: EDIT MEMBER SETTINGS
                               ══════════════════════════════════════════════════════════════ */}
                            {activeDetailTab === 'settings' && (
                                <div className="space-y-6">
                                    <form onSubmit={handleUpdateMember} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                                        <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Update Member Profile</p>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Full Name *</label>
                                                <input 
                                                    required
                                                    value={editForm.full_name || ''} 
                                                    onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none font-semibold"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Phone Number *</label>
                                                <input 
                                                    required
                                                    value={editForm.phone || ''} 
                                                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none font-semibold"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Club</label>
                                                <select 
                                                    value={editForm.club_name || 'GBN Club'} 
                                                    onChange={e => setEditForm({ ...editForm, club_name: e.target.value })}
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-2.5 text-xs outline-none bg-white font-bold text-slate-700"
                                                >
                                                    {allClubsList.map(c => (
                                                        <option key={c.name} value={c.name}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Chapter</label>
                                                <input 
                                                    value={editForm.chapter_name || ''} 
                                                    onChange={e => setEditForm({ ...editForm, chapter_name: e.target.value })}
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none font-bold text-slate-700"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Status</label>
                                                <select 
                                                    value={editForm.status} 
                                                    onChange={e => setEditForm({...editForm, status: e.target.value as any})}
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-2.5 text-xs outline-none bg-white font-bold text-slate-700"
                                                >
                                                    <option value="Active">Active</option>
                                                    <option value="Inactive">Inactive</option>
                                                    <option value="Suspended">Suspended</option>
                                                    <option value="Expired">Expired</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">WhatsApp Number</label>
                                                <input 
                                                    value={editForm.whatsapp_number || ''} 
                                                    onChange={e => setEditForm({...editForm, whatsapp_number: e.target.value})} 
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Alternate Phone</label>
                                                <input 
                                                    value={editForm.alternate_phone || ''} 
                                                    onChange={e => setEditForm({...editForm, alternate_phone: e.target.value})} 
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Business Name</label>
                                                <input 
                                                    value={editForm.business_name || ''} 
                                                    onChange={e => setEditForm({...editForm, business_name: e.target.value})} 
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Business Category / Type</label>
                                                <input 
                                                    value={editForm.business_category || editForm.business_type || ''} 
                                                    onChange={e => setEditForm({...editForm, business_category: e.target.value, business_type: e.target.value})} 
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Referred By</label>
                                                <input 
                                                    value={editForm.referred_by || ''} 
                                                    onChange={e => setEditForm({...editForm, referred_by: e.target.value})} 
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Home Address</label>
                                                <input 
                                                    value={editForm.home_address || ''} 
                                                    onChange={e => setEditForm({...editForm, home_address: e.target.value})} 
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Business Address</label>
                                                <input 
                                                    value={editForm.business_address || ''} 
                                                    onChange={e => setEditForm({...editForm, business_address: e.target.value})} 
                                                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs outline-none"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Services Provided</label>
                                                <textarea 
                                                    rows={2}
                                                    value={editForm.business_services || ''} 
                                                    onChange={e => setEditForm({...editForm, business_services: e.target.value})} 
                                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none resize-none"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Internal Notes</label>
                                                <textarea 
                                                    rows={2}
                                                    value={editForm.notes || ''} 
                                                    onChange={e => setEditForm({...editForm, notes: e.target.value})} 
                                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none resize-none"
                                                />
                                            </div>
                                        </div>

                                        <button 
                                            type="submit" 
                                            disabled={saving} 
                                            className="w-full h-11 bg-primary text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-primary-light transition shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-base">save</span>
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </form>

                                    {/* Danger Zone */}
                                    {isAdmin && (
                                        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-rose-800">Danger Zone</p>
                                                <p className="text-[11px] text-rose-500 mt-0.5">Permanently remove this member from the database.</p>
                                            </div>
                                            <button 
                                                onClick={handleDeleteMember}
                                                disabled={deleting}
                                                className="px-4 h-9 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-sm disabled:opacity-60"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                                {deleting ? 'Deleting...' : 'Delete Member'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClubMembers;
