-- Migration: Enrollment Approval Function
-- SECURITY DEFINER RPC that handles creating student profiles from approved enrollment applications
-- Supports both full-time (with auth user) and homeschool (profile-only, no auth) paths

CREATE OR REPLACE FUNCTION public.create_enrollment_profile(
  p_application_id UUID,
  p_create_auth_user BOOLEAN DEFAULT true,
  p_account_status TEXT DEFAULT 'active',
  p_admin_user_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_app RECORD;
  v_student_id UUID;
  v_parent_id UUID;
  v_parent_auth_id UUID;
  v_emergency JSONB;
  v_contact RECORD;
  v_can_login BOOLEAN;
  v_temp_password TEXT;
BEGIN
  -- Fetch the application
  SELECT * INTO v_app
  FROM public.enrollment_applications
  WHERE id = p_application_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Application not found');
  END IF;

  IF v_app.status = 'approved' THEN
    RETURN json_build_object('error', 'Application already approved');
  END IF;

  -- Determine if student can login
  v_can_login := p_create_auth_user AND p_account_status = 'active';

  -- For re-enrollment, update existing student record
  IF v_app.application_type = 're-enrollment' AND v_app.existing_student_id IS NOT NULL THEN
    v_student_id := v_app.existing_student_id;

    -- Update existing student profile
    UPDATE public.user_profiles SET
      grade_level = v_app.student_grade_applying,
      enrollment_type = v_app.student_enrollment_type,
      account_status = p_account_status,
      can_login = v_can_login,
      address_line1 = COALESCE(v_app.student_address_line1, address_line1),
      city = COALESCE(v_app.student_city, city),
      state = COALESCE(v_app.student_state, state)
    WHERE id = v_student_id;

  ELSE
    -- New enrollment: create student profile
    v_student_id := gen_random_uuid();

    IF p_create_auth_user AND v_app.student_email IS NOT NULL THEN
      -- Full-time student: auth user will be created by the admin via Supabase admin API
      -- We create the profile linked to the student_id (admin creates auth user separately)
      INSERT INTO public.user_profiles (
        id, email, username, first_name, last_name, user_type,
        grade_level, enrollment_type, account_status, can_login,
        address_line1, city, state, date_of_birth
      ) VALUES (
        v_student_id,
        v_app.student_email,
        LOWER(v_app.student_first_name || '.' || v_app.student_last_name),
        v_app.student_first_name,
        v_app.student_last_name,
        'student',
        v_app.student_grade_applying,
        v_app.student_enrollment_type,
        p_account_status,
        v_can_login,
        v_app.student_address_line1,
        v_app.student_city,
        v_app.student_state,
        v_app.student_dob
      );
    ELSE
      -- No email student: profile only, no login
      INSERT INTO public.user_profiles (
        id, username, first_name, last_name, user_type,
        grade_level, enrollment_type, account_status, can_login,
        address_line1, city, state, date_of_birth
      ) VALUES (
        v_student_id,
        LOWER(v_app.student_first_name || '.' || v_app.student_last_name || '.' || substr(v_student_id::text, 1, 4)),
        v_app.student_first_name,
        v_app.student_last_name,
        'student',
        v_app.student_grade_applying,
        v_app.student_enrollment_type,
        p_account_status,
        false,
        v_app.student_address_line1,
        v_app.student_city,
        v_app.student_state,
        v_app.student_dob
      );
    END IF;
  END IF;

  -- Create emergency contacts from JSONB array
  IF v_app.emergency_contacts IS NOT NULL AND jsonb_array_length(v_app.emergency_contacts) > 0 THEN
    FOR v_contact IN
      SELECT * FROM jsonb_to_recordset(v_app.emergency_contacts)
        AS x(name TEXT, relationship TEXT, phone TEXT, is_authorized_pickup BOOLEAN)
    LOOP
      INSERT INTO public.emergency_contacts (
        student_id, contact_name, relationship, phone_primary, can_pickup
      ) VALUES (
        v_student_id,
        v_contact.name,
        v_contact.relationship,
        v_contact.phone,
        COALESCE(v_contact.is_authorized_pickup, false)
      );
    END LOOP;
  END IF;

  -- Create student medical info
  INSERT INTO public.student_medical_info (
    student_id, allergies, conditions, medications,
    doctor_name, doctor_phone, insurance_provider, insurance_policy_number,
    notes
  ) VALUES (
    v_student_id,
    v_app.medical_allergies,
    v_app.medical_conditions,
    v_app.medical_medications,
    v_app.medical_doctor_name,
    v_app.medical_doctor_phone,
    v_app.medical_insurance_provider,
    v_app.medical_insurance_policy,
    v_app.medical_notes
  )
  ON CONFLICT (student_id) DO UPDATE SET
    allergies = EXCLUDED.allergies,
    conditions = EXCLUDED.conditions,
    medications = EXCLUDED.medications,
    doctor_name = EXCLUDED.doctor_name,
    doctor_phone = EXCLUDED.doctor_phone,
    insurance_provider = EXCLUDED.insurance_provider,
    insurance_policy_number = EXCLUDED.insurance_policy_number,
    notes = EXCLUDED.notes;

  -- Handle parent account
  -- Check if parent already exists by email
  SELECT id INTO v_parent_id
  FROM public.user_profiles
  WHERE email = v_app.parent1_email
  AND user_type = 'parent'
  LIMIT 1;

  -- If re-enrollment with existing parent, use that
  IF v_app.existing_parent_id IS NOT NULL THEN
    v_parent_id := v_app.existing_parent_id;
  END IF;

  -- If parent doesn't exist, create profile (auth user created by admin separately)
  IF v_parent_id IS NULL THEN
    v_parent_id := gen_random_uuid();

    INSERT INTO public.user_profiles (
      id, email, username, first_name, last_name, user_type,
      phone, account_status, can_login
    ) VALUES (
      v_parent_id,
      v_app.parent1_email,
      LOWER(v_app.parent1_first_name || '.' || v_app.parent1_last_name || '.' || substr(v_parent_id::text, 1, 4)),
      v_app.parent1_first_name,
      v_app.parent1_last_name,
      'parent',
      v_app.parent1_phone,
      'active',
      true
    );
  END IF;

  -- Link parent to student (if not already linked)
  INSERT INTO public.parent_child_links (parent_id, child_id)
  VALUES (v_parent_id, v_student_id)
  ON CONFLICT DO NOTHING;

  -- Handle second parent if provided
  IF v_app.parent2_email IS NOT NULL AND v_app.parent2_first_name IS NOT NULL THEN
    DECLARE
      v_parent2_id UUID;
    BEGIN
      SELECT id INTO v_parent2_id
      FROM public.user_profiles
      WHERE email = v_app.parent2_email
      AND user_type = 'parent'
      LIMIT 1;

      IF v_parent2_id IS NULL THEN
        v_parent2_id := gen_random_uuid();
        INSERT INTO public.user_profiles (
          id, email, username, first_name, last_name, user_type,
          phone, account_status, can_login
        ) VALUES (
          v_parent2_id,
          v_app.parent2_email,
          LOWER(v_app.parent2_first_name || '.' || v_app.parent2_last_name || '.' || substr(v_parent2_id::text, 1, 4)),
          v_app.parent2_first_name,
          v_app.parent2_last_name,
          'parent',
          v_app.parent2_phone,
          'active',
          true
        );
      END IF;

      INSERT INTO public.parent_child_links (parent_id, child_id)
      VALUES (v_parent2_id, v_student_id)
      ON CONFLICT DO NOTHING;
    END;
  END IF;

  -- Update the application status to approved
  UPDATE public.enrollment_applications SET
    status = 'approved',
    reviewed_by = p_admin_user_id,
    reviewed_at = NOW()
  WHERE id = p_application_id;

  RETURN json_build_object(
    'success', true,
    'student_id', v_student_id,
    'parent_id', v_parent_id,
    'can_login', v_can_login
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('error', 'A profile with this email or username already exists. Check for duplicates.');
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_enrollment_profile TO authenticated;

COMMENT ON FUNCTION public.create_enrollment_profile IS
'Creates student profile, emergency contacts, medical info, and parent links from an approved enrollment application.
Supports full-time (with auth user) and homeschool (profile-only) paths.
Uses SECURITY DEFINER to bypass RLS for profile creation.';
