-- Add facility link and structured scheduling to activities
-- Mirrors class facility link (add_class_facility_link.sql) and class_schedule (attendance_system.sql)

-- ============================================
-- Add facility_id to activities table
-- ============================================
ALTER TABLE activities ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_activities_facility_id ON activities(facility_id);

-- ============================================
-- Activity Schedule - Which days/periods each activity meets
-- ============================================
CREATE TABLE IF NOT EXISTS activity_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  period INTEGER NOT NULL CHECK (period >= 1 AND period <= 10),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(activity_id, day_of_week, period)
);

CREATE INDEX IF NOT EXISTS idx_activity_schedule_activity_id ON activity_schedule(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_schedule_day ON activity_schedule(day_of_week);
CREATE INDEX IF NOT EXISTS idx_activity_schedule_period ON activity_schedule(period);

-- ============================================
-- RLS Policies for activity_schedule
-- ============================================
ALTER TABLE activity_schedule ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view activity schedules
CREATE POLICY "Authenticated can view activity schedules"
  ON activity_schedule FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can manage all activity schedules
CREATE POLICY "Admins can manage activity schedules"
  ON activity_schedule FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Coaches can manage their own activity schedules
CREATE POLICY "Coaches can manage own activity schedules"
  ON activity_schedule FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE id = activity_schedule.activity_id AND coach_id = auth.uid()
    )
  );
