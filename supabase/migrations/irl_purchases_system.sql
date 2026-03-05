-- IRL Purchases System
-- Tables for managing in-real-life store items and purchase transactions

-- ============================================================
-- Table: irl_store_items — Catalog of IRL purchasable items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.irl_store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price > 0),
  icon TEXT DEFAULT '🛒',
  category TEXT DEFAULT 'General',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Table: irl_purchases — Log of all IRL purchases
-- ============================================================
CREATE TABLE IF NOT EXISTS public.irl_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.user_profiles(id),
  item_id UUID REFERENCES public.irl_store_items(id),
  item_name TEXT NOT NULL,
  price_paid INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_deducted INTEGER NOT NULL,
  description TEXT,
  processed_by UUID NOT NULL REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_irl_purchases_student ON public.irl_purchases(student_id);
CREATE INDEX IF NOT EXISTS idx_irl_purchases_created ON public.irl_purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_irl_store_items_active ON public.irl_store_items(is_active, sort_order);

-- ============================================================
-- RLS Policies for irl_store_items
-- ============================================================
ALTER TABLE public.irl_store_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers and admins can view store items"
  ON public.irl_store_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND user_type IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Admins can insert store items"
  ON public.irl_store_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update store items"
  ON public.irl_store_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can delete store items"
  ON public.irl_store_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- ============================================================
-- RLS Policies for irl_purchases
-- ============================================================
ALTER TABLE public.irl_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers and admins can view purchases"
  ON public.irl_purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND user_type IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Teachers and admins can insert purchases"
  ON public.irl_purchases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND user_type IN ('teacher', 'admin')
    )
  );

-- ============================================================
-- RPC Function: process_irl_purchase
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_irl_purchase(
  p_student_id UUID,
  p_item_id UUID DEFAULT NULL,
  p_custom_name TEXT DEFAULT NULL,
  p_custom_price INTEGER DEFAULT NULL,
  p_quantity INTEGER DEFAULT 1,
  p_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item_name TEXT;
  v_item_price INTEGER;
  v_total INTEGER;
  v_processor_id UUID;
  v_purchase_id UUID;
  v_txn_result JSON;
  v_processor_type TEXT;
BEGIN
  -- Get the processor (calling user)
  v_processor_id := auth.uid();

  -- Verify processor is teacher or admin
  SELECT user_type INTO v_processor_type
  FROM public.user_profiles
  WHERE id = v_processor_id;

  IF v_processor_type NOT IN ('teacher', 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Only teachers and admins can process IRL purchases');
  END IF;

  -- Validate quantity
  IF p_quantity < 1 THEN
    RETURN json_build_object('success', false, 'error', 'Quantity must be at least 1');
  END IF;

  -- Resolve item name and price
  IF p_item_id IS NOT NULL THEN
    -- Catalog item
    SELECT name, price INTO v_item_name, v_item_price
    FROM public.irl_store_items
    WHERE id = p_item_id AND is_active = true;

    IF v_item_name IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'Item not found or inactive');
    END IF;
  ELSE
    -- Custom item
    IF p_custom_name IS NULL OR p_custom_name = '' THEN
      RETURN json_build_object('success', false, 'error', 'Custom item name is required');
    END IF;
    IF p_custom_price IS NULL OR p_custom_price < 1 THEN
      RETURN json_build_object('success', false, 'error', 'Custom item price must be at least 1');
    END IF;
    v_item_name := p_custom_name;
    v_item_price := p_custom_price;
  END IF;

  -- Calculate total
  v_total := v_item_price * p_quantity;

  -- Process the RTC deduction via existing transaction system
  SELECT public.process_rtc_transaction(
    p_user_id := p_student_id,
    p_amount := -v_total,
    p_transaction_type := 'spend_reward',
    p_description := 'IRL Purchase: ' || v_item_name || CASE WHEN p_quantity > 1 THEN ' x' || p_quantity ELSE '' END,
    p_created_by := v_processor_id
  ) INTO v_txn_result;

  -- Check if transaction succeeded
  IF NOT (v_txn_result->>'success')::boolean THEN
    RETURN json_build_object('success', false, 'error', v_txn_result->>'error');
  END IF;

  -- Insert purchase log entry
  INSERT INTO public.irl_purchases (student_id, item_id, item_name, price_paid, quantity, total_deducted, description, processed_by)
  VALUES (p_student_id, p_item_id, v_item_name, v_item_price, p_quantity, v_total, p_description, v_processor_id)
  RETURNING id INTO v_purchase_id;

  RETURN json_build_object(
    'success', true,
    'purchase_id', v_purchase_id,
    'new_balance', (v_txn_result->>'new_balance')::integer,
    'total_deducted', v_total
  );
END;
$$;
