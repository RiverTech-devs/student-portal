-- Migration: Fix signup profile creation RLS issue
-- Problem: During signup, auth.uid() is NULL for anon users, so RLS policy fails
-- Solution: Create a SECURITY DEFINER function that bypasses RLS for signup

-- Create a function to safely create user profiles during signup
-- This function validates the input and creates the profile
CREATE OR REPLACE FUNCTION public.create_signup_profile(
    user_id UUID,
    user_email TEXT,
    user_username TEXT,
    user_first_name TEXT,
    user_last_name TEXT,
    user_type TEXT,
    user_grade_level TEXT DEFAULT NULL,
    user_enrollment_type TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    result JSON;
BEGIN
    -- Validate user_id exists in auth.users (must be a real auth user)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
        RETURN json_build_object('error', 'Invalid user ID - user does not exist in auth system');
    END IF;

    -- Validate user_type is allowed for self-registration
    IF user_type NOT IN ('student', 'parent') THEN
        RETURN json_build_object('error', 'Invalid user type for self-registration');
    END IF;

    -- Check if profile already exists
    IF EXISTS (SELECT 1 FROM public.user_profiles WHERE id = user_id) THEN
        RETURN json_build_object('success', true, 'message', 'Profile already exists');
    END IF;

    -- Check for duplicate username
    IF EXISTS (SELECT 1 FROM public.user_profiles WHERE username = user_username) THEN
        RETURN json_build_object('error', 'Username already taken');
    END IF;

    -- Check for duplicate email
    IF EXISTS (SELECT 1 FROM public.user_profiles WHERE email = user_email) THEN
        RETURN json_build_object('error', 'Email already registered');
    END IF;

    -- Insert the profile
    INSERT INTO public.user_profiles (
        id,
        auth_user_id,
        email,
        username,
        first_name,
        last_name,
        user_type,
        grade_level,
        enrollment_type,
        account_status,
        can_login
    ) VALUES (
        user_id,
        user_id,
        user_email,
        user_username,
        user_first_name,
        user_last_name,
        user_type,
        CASE WHEN user_type = 'student' THEN user_grade_level ELSE NULL END,
        CASE WHEN user_type = 'student' THEN user_enrollment_type ELSE NULL END,
        'active',
        true
    );

    RETURN json_build_object('success', true);
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object('error', 'A profile with this email or username already exists');
    WHEN OTHERS THEN
        RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.create_signup_profile TO anon;
GRANT EXECUTE ON FUNCTION public.create_signup_profile TO authenticated;

-- Add a comment explaining the function
COMMENT ON FUNCTION public.create_signup_profile IS
'Securely creates a user profile during signup. Validates that the user_id exists in auth.users
and that user_type is valid for self-registration (student or parent only).
Uses SECURITY DEFINER to bypass RLS since auth.uid() is NULL during signup.';
