-- ============================================================
-- RTC Cosmetics System
-- Adds purchaseable permanent cosmetics (Avatars, Titles, Badges)
-- Students spend RTC once and keep cosmetics forever
-- Equip/unequip functionality visible on profiles
-- ============================================================

-- ============================================================
-- 1A. rtc_cosmetics table (the catalog)
-- ============================================================
CREATE TABLE IF NOT EXISTS rtc_cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🎨',
  description TEXT,
  price INTEGER NOT NULL CHECK (price > 0),
  category TEXT NOT NULL CHECK (category IN ('avatar', 'title', 'badge')),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rtc_cosmetics_active ON rtc_cosmetics(is_active, category, sort_order);

ALTER TABLE rtc_cosmetics ENABLE ROW LEVEL SECURITY;

-- Admins have full access
DROP POLICY IF EXISTS "Admins full access to cosmetics" ON rtc_cosmetics;
CREATE POLICY "Admins full access to cosmetics" ON rtc_cosmetics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND user_type = 'admin'
    )
  );

-- Teachers have full access
DROP POLICY IF EXISTS "Teachers full access to cosmetics" ON rtc_cosmetics;
CREATE POLICY "Teachers full access to cosmetics" ON rtc_cosmetics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND user_type = 'teacher'
    )
  );

-- Students can view active cosmetics only
DROP POLICY IF EXISTS "Students view active cosmetics" ON rtc_cosmetics;
CREATE POLICY "Students view active cosmetics" ON rtc_cosmetics
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND user_type = 'student'
    )
  );

GRANT SELECT ON rtc_cosmetics TO authenticated;
GRANT ALL ON rtc_cosmetics TO service_role;

-- ============================================================
-- 1B. rtc_cosmetic_purchases table (ownership)
-- ============================================================
CREATE TABLE IF NOT EXISTS rtc_cosmetic_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  cosmetic_id UUID NOT NULL REFERENCES rtc_cosmetics(id) ON DELETE CASCADE,
  price_paid INTEGER NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, cosmetic_id)
);

CREATE INDEX IF NOT EXISTS idx_rtc_cosmetic_purchases_user ON rtc_cosmetic_purchases(user_id);

ALTER TABLE rtc_cosmetic_purchases ENABLE ROW LEVEL SECURITY;

-- Students can view their own purchases
DROP POLICY IF EXISTS "Students view own cosmetic purchases" ON rtc_cosmetic_purchases;
CREATE POLICY "Students view own cosmetic purchases" ON rtc_cosmetic_purchases
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Admins have full access
DROP POLICY IF EXISTS "Admins full access to cosmetic purchases" ON rtc_cosmetic_purchases;
CREATE POLICY "Admins full access to cosmetic purchases" ON rtc_cosmetic_purchases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND user_type = 'admin'
    )
  );

-- Teachers can view all
DROP POLICY IF EXISTS "Teachers view cosmetic purchases" ON rtc_cosmetic_purchases;
CREATE POLICY "Teachers view cosmetic purchases" ON rtc_cosmetic_purchases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND user_type = 'teacher'
    )
  );

GRANT SELECT ON rtc_cosmetic_purchases TO authenticated;
GRANT ALL ON rtc_cosmetic_purchases TO service_role;

-- ============================================================
-- 1C. Add equipped cosmetic columns to user_profiles
-- ============================================================
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS equipped_avatar UUID REFERENCES rtc_cosmetics(id) ON DELETE SET NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS equipped_title UUID REFERENCES rtc_cosmetics(id) ON DELETE SET NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS equipped_badge1 UUID REFERENCES rtc_cosmetics(id) ON DELETE SET NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS equipped_badge2 UUID REFERENCES rtc_cosmetics(id) ON DELETE SET NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS equipped_badge3 UUID REFERENCES rtc_cosmetics(id) ON DELETE SET NULL;

-- ============================================================
-- 1D. rtc_get_cosmetics_data() — SECURITY DEFINER RPC
-- Returns wallet_balance, catalog, owned_ids, equipped slots
-- ============================================================
CREATE OR REPLACE FUNCTION public.rtc_get_cosmetics_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_wallet_balance INTEGER;
  v_catalog JSON;
  v_owned_ids JSON;
  v_equipped JSON;
BEGIN
  -- Resolve user from auth.uid()
  SELECT id INTO v_user_id
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Get wallet balance
  SELECT rtc_balance INTO v_wallet_balance
  FROM public.user_profiles
  WHERE id = v_user_id;

  -- Get all active catalog cosmetics
  SELECT COALESCE(json_agg(c ORDER BY c.sort_order, c.name), '[]'::json) INTO v_catalog
  FROM (
    SELECT id, name, icon, description, price, category, sort_order
    FROM public.rtc_cosmetics
    WHERE is_active = true
    ORDER BY sort_order, name
  ) c;

  -- Get owned cosmetic IDs
  SELECT COALESCE(json_agg(cp.cosmetic_id), '[]'::json) INTO v_owned_ids
  FROM public.rtc_cosmetic_purchases cp
  WHERE cp.user_id = v_user_id;

  -- Get equipped cosmetics with their details
  SELECT json_build_object(
    'avatar', CASE WHEN up.equipped_avatar IS NOT NULL THEN (
      SELECT json_build_object('id', rc.id, 'name', rc.name, 'icon', rc.icon, 'category', rc.category)
      FROM public.rtc_cosmetics rc WHERE rc.id = up.equipped_avatar
    ) ELSE NULL END,
    'title', CASE WHEN up.equipped_title IS NOT NULL THEN (
      SELECT json_build_object('id', rc.id, 'name', rc.name, 'icon', rc.icon, 'category', rc.category)
      FROM public.rtc_cosmetics rc WHERE rc.id = up.equipped_title
    ) ELSE NULL END,
    'badge1', CASE WHEN up.equipped_badge1 IS NOT NULL THEN (
      SELECT json_build_object('id', rc.id, 'name', rc.name, 'icon', rc.icon, 'category', rc.category)
      FROM public.rtc_cosmetics rc WHERE rc.id = up.equipped_badge1
    ) ELSE NULL END,
    'badge2', CASE WHEN up.equipped_badge2 IS NOT NULL THEN (
      SELECT json_build_object('id', rc.id, 'name', rc.name, 'icon', rc.icon, 'category', rc.category)
      FROM public.rtc_cosmetics rc WHERE rc.id = up.equipped_badge2
    ) ELSE NULL END,
    'badge3', CASE WHEN up.equipped_badge3 IS NOT NULL THEN (
      SELECT json_build_object('id', rc.id, 'name', rc.name, 'icon', rc.icon, 'category', rc.category)
      FROM public.rtc_cosmetics rc WHERE rc.id = up.equipped_badge3
    ) ELSE NULL END
  ) INTO v_equipped
  FROM public.user_profiles up
  WHERE up.id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'wallet_balance', v_wallet_balance,
    'catalog', v_catalog,
    'owned_ids', v_owned_ids,
    'equipped', v_equipped
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rtc_get_cosmetics_data() TO authenticated;

-- ============================================================
-- 1E. rtc_purchase_cosmetic(p_cosmetic_id UUID) — SECURITY DEFINER RPC
-- Deducts RTC, inserts purchase record
-- ============================================================
CREATE OR REPLACE FUNCTION public.rtc_purchase_cosmetic(p_cosmetic_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_cosmetic RECORD;
  v_wallet_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Resolve user from auth.uid()
  SELECT id INTO v_user_id
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Load cosmetic (must be active)
  SELECT id, name, price, category, is_active
  INTO v_cosmetic
  FROM public.rtc_cosmetics
  WHERE id = p_cosmetic_id;

  IF v_cosmetic.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Cosmetic not found');
  END IF;

  IF NOT v_cosmetic.is_active THEN
    RETURN json_build_object('success', false, 'error', 'This cosmetic is no longer available');
  END IF;

  -- Check not already owned
  IF EXISTS (
    SELECT 1 FROM public.rtc_cosmetic_purchases
    WHERE user_id = v_user_id AND cosmetic_id = p_cosmetic_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'You already own this cosmetic');
  END IF;

  -- Lock wallet, check sufficient balance
  SELECT rtc_balance INTO v_wallet_balance
  FROM public.user_profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_wallet_balance < v_cosmetic.price THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient RTC balance (need ' || v_cosmetic.price || ', have ' || v_wallet_balance || ')');
  END IF;

  -- Debit wallet
  v_new_balance := v_wallet_balance - v_cosmetic.price;
  UPDATE public.user_profiles
  SET rtc_balance = v_new_balance
  WHERE id = v_user_id;

  -- Log spend_cosmetic transaction
  INSERT INTO public.rtc_transactions (
    user_id, amount, transaction_type, description, balance_after, created_by
  ) VALUES (
    v_user_id, -v_cosmetic.price, 'spend_cosmetic',
    'Purchased cosmetic: ' || v_cosmetic.name,
    v_new_balance, v_user_id
  );

  -- Insert purchase record
  INSERT INTO public.rtc_cosmetic_purchases (
    user_id, cosmetic_id, price_paid
  ) VALUES (
    v_user_id, p_cosmetic_id, v_cosmetic.price
  );

  RETURN json_build_object(
    'success', true,
    'new_balance', v_new_balance
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rtc_purchase_cosmetic(UUID) TO authenticated;

-- ============================================================
-- 1F. rtc_equip_cosmetic(p_cosmetic_id UUID, p_slot TEXT) — SECURITY DEFINER RPC
-- Validates ownership + category match, updates equipped column
-- NULL cosmetic_id = unequip
-- ============================================================
CREATE OR REPLACE FUNCTION public.rtc_equip_cosmetic(p_cosmetic_id UUID, p_slot TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_cosmetic RECORD;
  v_valid_slots TEXT[] := ARRAY['avatar', 'title', 'badge1', 'badge2', 'badge3'];
BEGIN
  -- Validate slot
  IF p_slot IS NULL OR NOT (p_slot = ANY(v_valid_slots)) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid slot. Must be: avatar, title, badge1, badge2, or badge3');
  END IF;

  -- Resolve user from auth.uid()
  SELECT id INTO v_user_id
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- If unequipping (null cosmetic_id)
  IF p_cosmetic_id IS NULL THEN
    EXECUTE format('UPDATE public.user_profiles SET %I = NULL WHERE id = $1', 'equipped_' || p_slot)
    USING v_user_id;

    RETURN json_build_object('success', true, 'action', 'unequipped');
  END IF;

  -- Load cosmetic and validate
  SELECT id, name, category
  INTO v_cosmetic
  FROM public.rtc_cosmetics
  WHERE id = p_cosmetic_id;

  IF v_cosmetic.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Cosmetic not found');
  END IF;

  -- Validate category matches slot
  IF (p_slot = 'avatar' AND v_cosmetic.category != 'avatar')
    OR (p_slot = 'title' AND v_cosmetic.category != 'title')
    OR (p_slot IN ('badge1', 'badge2', 'badge3') AND v_cosmetic.category != 'badge')
  THEN
    RETURN json_build_object('success', false, 'error', 'Category mismatch: cannot equip ' || v_cosmetic.category || ' in ' || p_slot || ' slot');
  END IF;

  -- Validate ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.rtc_cosmetic_purchases
    WHERE user_id = v_user_id AND cosmetic_id = p_cosmetic_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'You do not own this cosmetic');
  END IF;

  -- Equip
  EXECUTE format('UPDATE public.user_profiles SET %I = $1 WHERE id = $2', 'equipped_' || p_slot)
  USING p_cosmetic_id, v_user_id;

  RETURN json_build_object('success', true, 'action', 'equipped', 'name', v_cosmetic.name);

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rtc_equip_cosmetic(UUID, TEXT) TO authenticated;
