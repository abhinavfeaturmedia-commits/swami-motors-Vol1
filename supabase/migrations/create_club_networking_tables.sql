-- ==============================================================================
-- DATABASE MIGRATION: ADVANCED CLUB & NETWORKING MANAGEMENT
-- Supporting Multi-Club, Chapters, Attendance, Presentations, 1-to-1s, 
-- 1-to-Many, Referrals, Done Deals (Business Volume), and Gifting.
-- ==============================================================================

-- 1. Create networking_clubs table
CREATE TABLE IF NOT EXISTS public.networking_clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    code TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Seed default clubs if not present
INSERT INTO public.networking_clubs (name, code, description)
VALUES 
    ('GBN Club', 'GBN', 'Global Business Network Club'),
    ('Saturday Club', 'SAT', 'Saturday Business Club'),
    ('BNI Club', 'BNI', 'Business Network International'),
    ('Rotary Club', 'ROT', 'Rotary International Club')
ON CONFLICT (name) DO NOTHING;

-- 2. Create club_chapters table
CREATE TABLE IF NOT EXISTS public.club_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES public.networking_clubs(id) ON DELETE CASCADE,
    club_name TEXT NOT NULL,
    name TEXT NOT NULL,
    city TEXT DEFAULT 'Kolhapur',
    meeting_day TEXT DEFAULT 'Wednesday',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_club_chapter UNIQUE (club_name, name)
);

-- Seed default chapters for clubs
INSERT INTO public.club_chapters (club_name, name, city)
VALUES 
    ('GBN Club', 'Megha Chapter', 'Kolhapur'),
    ('Saturday Club', 'Varsha Chapter', 'Kolhapur'),
    ('Rotary Club', 'Bavada Chapter', 'Kolhapur')
ON CONFLICT DO NOTHING;

-- 3. Enhance club_members table
ALTER TABLE public.club_members 
ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.networking_clubs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS club_name TEXT DEFAULT 'GBN Club',
ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.club_chapters(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS chapter_name TEXT DEFAULT 'General',
ADD COLUMN IF NOT EXISTS business_category TEXT;

-- 4. Create club_attendance table
CREATE TABLE IF NOT EXISTS public.club_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.club_members(id) ON DELETE CASCADE NOT NULL,
    meeting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    club_name TEXT NOT NULL,
    chapter_name TEXT NOT NULL,
    is_home_chapter BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Substitute', 'Late')),
    substitute_name TEXT,
    notes TEXT,
    marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_club_attendance_member_id ON public.club_attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_club_attendance_meeting_date ON public.club_attendance(meeting_date);

-- 5. Create club_presentations table
CREATE TABLE IF NOT EXISTS public.club_presentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.club_members(id) ON DELETE CASCADE NOT NULL,
    presentation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    topic TEXT NOT NULL,
    presentation_type TEXT DEFAULT 'Feature' CHECK (presentation_type IN ('Feature', '30_Second', '8_Minute', 'Showcase', 'Other')),
    chapter_name TEXT NOT NULL,
    is_cross_chapter BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_club_presentations_member_id ON public.club_presentations(member_id);

-- 6. Create club_one_to_one table
CREATE TABLE IF NOT EXISTS public.club_one_to_one (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiator_member_id UUID REFERENCES public.club_members(id) ON DELETE CASCADE NOT NULL,
    with_member_id UUID REFERENCES public.club_members(id) ON DELETE SET NULL,
    with_member_name TEXT NOT NULL,
    meeting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    location TEXT,
    chapter_name TEXT,
    discussion_topics TEXT,
    outcomes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_club_one_to_one_initiator ON public.club_one_to_one(initiator_member_id);
CREATE INDEX IF NOT EXISTS idx_club_one_to_one_with_member ON public.club_one_to_one(with_member_id);

-- 7. Create club_one_to_many table
CREATE TABLE IF NOT EXISTS public.club_one_to_many (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_member_id UUID REFERENCES public.club_members(id) ON DELETE CASCADE NOT NULL,
    host_name TEXT NOT NULL,
    title TEXT NOT NULL,
    meeting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    location_or_mode TEXT,
    attendee_ids JSONB DEFAULT '[]'::jsonb,
    attendee_names TEXT[] DEFAULT ARRAY[]::TEXT[],
    attendee_count INT DEFAULT 0,
    key_takeaways TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_club_one_to_many_host ON public.club_one_to_many(host_member_id);

-- 8. Create club_referrals table
CREATE TABLE IF NOT EXISTS public.club_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    giver_member_id UUID REFERENCES public.club_members(id) ON DELETE SET NULL,
    receiver_member_id UUID REFERENCES public.club_members(id) ON DELETE SET NULL,
    giver_name TEXT,
    receiver_name TEXT,
    referral_name TEXT NOT NULL,
    referral_phone TEXT,
    referral_type TEXT DEFAULT 'Inside' CHECK (referral_type IN ('Inside', 'Outside', 'Cross_Chapter')),
    status TEXT DEFAULT 'Given' CHECK (status IN ('Given', 'Contacted', 'In_Progress', 'Closed_Deal', 'Lost')),
    estimated_value NUMERIC(12,2) DEFAULT 0.00,
    notes TEXT,
    referral_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_club_referrals_giver ON public.club_referrals(giver_member_id);
CREATE INDEX IF NOT EXISTS idx_club_referrals_receiver ON public.club_referrals(receiver_member_id);

-- 9. Create club_business_deals (Done Deals / Business Volume)
CREATE TABLE IF NOT EXISTS public.club_business_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.club_members(id) ON DELETE CASCADE NOT NULL,
    given_by_member_id UUID REFERENCES public.club_members(id) ON DELETE SET NULL,
    given_by_name TEXT,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    deal_type TEXT DEFAULT 'New_Business' CHECK (deal_type IN ('New_Business', 'Repeat_Business', 'Tier_3_Referral')),
    deal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    chapter_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_club_business_deals_member ON public.club_business_deals(member_id);

-- 10. Create club_gifts table
CREATE TABLE IF NOT EXISTS public.club_gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    giver_member_id UUID REFERENCES public.club_members(id) ON DELETE SET NULL,
    giver_name TEXT,
    receiver_member_id UUID REFERENCES public.club_members(id) ON DELETE CASCADE NOT NULL,
    gift_name TEXT NOT NULL,
    gift_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_club_gifts_receiver ON public.club_gifts(receiver_member_id);

-- 11. Enable Row Level Security (RLS) for all new tables
ALTER TABLE public.networking_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_one_to_one ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_one_to_many ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_business_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_gifts ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies: Admins full access, Staff view & manage crm
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'networking_clubs', 
        'club_chapters', 
        'club_attendance', 
        'club_presentations', 
        'club_one_to_one', 
        'club_one_to_many', 
        'club_referrals', 
        'club_business_deals', 
        'club_gifts'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Admins have full access to %I" ON public.%I;', t, t);
        EXECUTE format('CREATE POLICY "Admins have full access to %I" ON public.%I FOR ALL USING (is_admin());', t, t);
        
        EXECUTE format('DROP POLICY IF EXISTS "Staff can view %I" ON public.%I;', t, t);
        EXECUTE format('CREATE POLICY "Staff can view %I" ON public.%I FOR SELECT USING (is_staff() AND staff_can_view(''crm''));', t, t);
        
        EXECUTE format('DROP POLICY IF EXISTS "Staff can manage %I" ON public.%I;', t, t);
        EXECUTE format('CREATE POLICY "Staff can manage %I" ON public.%I FOR ALL USING (is_staff() AND staff_can_manage(''crm''));', t, t);
    END LOOP;
END $$;
