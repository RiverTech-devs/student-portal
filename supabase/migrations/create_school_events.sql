-- School Events table for holidays, closures, half days, and general events
CREATE TABLE school_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL DEFAULT 'event',  -- 'holiday', 'closure', 'half_day', 'event'
    start_date DATE NOT NULL,
    end_date DATE,  -- NULL = single-day event
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_school_events_dates ON school_events(start_date, end_date);

ALTER TABLE school_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read school events" ON school_events
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage school events" ON school_events
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
    );
