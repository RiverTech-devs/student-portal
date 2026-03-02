-- Facilities & Room Booking Management Tables
-- ================================================

-- Facilities table
CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'classroom' CHECK (type IN ('classroom', 'gym', 'auditorium', 'lab', 'field', 'conference', 'other')),
  capacity INTEGER,
  description TEXT,
  requires_approval BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_facilities_type ON facilities(type);
CREATE INDEX IF NOT EXISTS idx_facilities_is_active ON facilities(is_active);

-- Comments
COMMENT ON TABLE facilities IS 'School rooms and facilities available for booking';
COMMENT ON COLUMN facilities.requires_approval IS 'Whether bookings need admin approval';

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_facilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_facilities_updated_at
  BEFORE UPDATE ON facilities
  FOR EACH ROW
  EXECUTE FUNCTION update_facilities_updated_at();

-- RLS
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins have full access to facilities"
  ON facilities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- All authenticated users can view active facilities
CREATE POLICY "Users can view active facilities"
  ON facilities FOR SELECT
  USING (is_active = true);

-- ================================================
-- Facility Bookings table
CREATE TABLE IF NOT EXISTS facility_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  booked_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'cancelled')),
  recurrence TEXT NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekly', 'biweekly', 'monthly')),
  recurrence_end_date DATE,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time > start_time)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_facility_bookings_facility ON facility_bookings(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_bookings_booked_by ON facility_bookings(booked_by);
CREATE INDEX IF NOT EXISTS idx_facility_bookings_status ON facility_bookings(status);
CREATE INDEX IF NOT EXISTS idx_facility_bookings_date ON facility_bookings(booking_date);

-- Comments
COMMENT ON TABLE facility_bookings IS 'Room/facility booking requests and approvals';

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_facility_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_facility_bookings_updated_at
  BEFORE UPDATE ON facility_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_facility_bookings_updated_at();

-- Booking conflict detection function
CREATE OR REPLACE FUNCTION check_booking_conflict(
  p_facility_id UUID,
  p_booking_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM facility_bookings
    WHERE facility_id = p_facility_id
      AND booking_date = p_booking_date
      AND status IN ('pending', 'approved')
      AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
      AND start_time < p_end_time
      AND end_time > p_start_time
  );
END;
$$;

COMMENT ON FUNCTION check_booking_conflict IS 'Returns true if a time conflict exists for the given facility/date/time range';

-- RLS
ALTER TABLE facility_bookings ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins have full access to facility_bookings"
  ON facility_bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Teachers can create their own bookings
CREATE POLICY "Teachers can insert own bookings"
  ON facility_bookings FOR INSERT
  WITH CHECK (
    booked_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'teacher'
    )
  );

-- Teachers can view approved bookings and their own
CREATE POLICY "Teachers can view approved and own bookings"
  ON facility_bookings FOR SELECT
  USING (
    status = 'approved'
    OR booked_by = auth.uid()
  );

-- Users can cancel their own bookings
CREATE POLICY "Users can cancel own bookings"
  ON facility_bookings FOR UPDATE
  USING (booked_by = auth.uid())
  WITH CHECK (booked_by = auth.uid() AND status = 'cancelled');
