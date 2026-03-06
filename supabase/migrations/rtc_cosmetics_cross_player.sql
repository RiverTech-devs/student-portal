-- ============================================================
-- RTC Cosmetics — Cross-Player Batch Lookup
-- Returns equipped cosmetics for an array of user IDs
-- Used by arcade leaderboard, friends list, search results
-- ============================================================

CREATE OR REPLACE FUNCTION public.rtc_get_player_cosmetics(p_user_ids UUID[])
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT COALESCE(json_object_agg(sub.user_id::text, sub.cosmetics), '{}'::json)
  INTO v_result
  FROM (
    SELECT
      up.id AS user_id,
      json_build_object(
        'avatar', CASE WHEN up.equipped_avatar IS NOT NULL THEN (
          SELECT json_build_object('icon', rc.icon, 'name', rc.name)
          FROM public.rtc_cosmetics rc WHERE rc.id = up.equipped_avatar
        ) ELSE NULL END,
        'title', CASE WHEN up.equipped_title IS NOT NULL THEN (
          SELECT json_build_object('icon', rc.icon, 'name', rc.name)
          FROM public.rtc_cosmetics rc WHERE rc.id = up.equipped_title
        ) ELSE NULL END,
        'badge1', CASE WHEN up.equipped_badge1 IS NOT NULL THEN (
          SELECT json_build_object('icon', rc.icon, 'name', rc.name)
          FROM public.rtc_cosmetics rc WHERE rc.id = up.equipped_badge1
        ) ELSE NULL END,
        'badge2', CASE WHEN up.equipped_badge2 IS NOT NULL THEN (
          SELECT json_build_object('icon', rc.icon, 'name', rc.name)
          FROM public.rtc_cosmetics rc WHERE rc.id = up.equipped_badge2
        ) ELSE NULL END,
        'badge3', CASE WHEN up.equipped_badge3 IS NOT NULL THEN (
          SELECT json_build_object('icon', rc.icon, 'name', rc.name)
          FROM public.rtc_cosmetics rc WHERE rc.id = up.equipped_badge3
        ) ELSE NULL END
      ) AS cosmetics
    FROM public.user_profiles up
    WHERE up.id = ANY(p_user_ids)
  ) sub;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rtc_get_player_cosmetics(UUID[]) TO authenticated;
