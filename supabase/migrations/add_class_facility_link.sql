-- Link classes to facilities/rooms
ALTER TABLE classes ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_classes_facility_id ON classes(facility_id);
