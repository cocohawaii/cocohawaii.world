-- Allow selecting specific ticket numbers when entering raffle
-- enter_raffle_secure(p_raffle_id, p_quantity, p_ticket_numbers)
-- p_ticket_numbers: optional INTEGER[] - if provided, use these numbers; if null/empty, use next available

CREATE OR REPLACE FUNCTION public.enter_raffle_secure(
  p_raffle_id UUID,
  p_quantity INTEGER DEFAULT 1,
  p_ticket_numbers INTEGER[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_auth_uid UUID;
  v_member_id UUID;
  v_member_star_bids INT;
  v_raffle RECORD;
  v_total_entries INT;
  v_user_entries INT;
  v_cost INT;
  v_new_balance INT;
  v_ticket_start INT;
  v_i INT;
  v_num INT;
  v_sold INT[];
  v_requested INT[];
BEGIN
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  p_quantity := GREATEST(1, LEAST(p_quantity, 100));

  -- Get member
  SELECT id, COALESCE(star_bids, 0) INTO v_member_id, v_member_star_bids
  FROM public.members WHERE auth_id = v_auth_uid;
  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member not found');
  END IF;

  -- Lock raffle row
  SELECT r.*, r.total_entries INTO v_raffle
  FROM public.raffles r
  WHERE r.id = p_raffle_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Raffle not found');
  END IF;

  IF v_raffle.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Raffle is not active');
  END IF;

  IF NOW() < v_raffle.start_date THEN
    RETURN jsonb_build_object('success', false, 'error', 'Raffle has not started yet');
  END IF;

  IF NOW() > v_raffle.end_date THEN
    RETURN jsonb_build_object('success', false, 'error', 'Raffle has ended');
  END IF;

  v_cost := (v_raffle.ticket_price::INT * p_quantity);
  IF v_cost < 0 THEN v_cost := 0; END IF;

  -- Check capacity
  IF v_raffle.total_entries + p_quantity > v_raffle.max_entries THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only ' || GREATEST(0, v_raffle.max_entries - v_raffle.total_entries) || ' tickets remaining'
    );
  END IF;

  -- Check per-user limit
  IF v_raffle.ticket_limit_per_user IS NOT NULL AND v_raffle.ticket_limit_per_user > 0 THEN
    SELECT COALESCE(SUM(quantity), 0)::INT INTO v_user_entries
    FROM public.raffle_entries
    WHERE raffle_id = p_raffle_id AND member_id = v_member_id;
    IF v_user_entries + p_quantity > v_raffle.ticket_limit_per_user THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'You can only buy up to ' || v_raffle.ticket_limit_per_user || ' ticket(s) per raffle. You already have ' || v_user_entries
      );
    END IF;
  END IF;

  -- Check star bids
  IF v_member_star_bids < v_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient Star Bids!',
      'currentBalance', v_member_star_bids,
      'required', v_cost
    );
  END IF;

  -- Get already sold ticket numbers
  SELECT COALESCE(array_agg(ticket_number), ARRAY[]::INT[]) INTO v_sold
  FROM public.raffle_entries
  WHERE raffle_id = p_raffle_id AND ticket_number IS NOT NULL;

  IF p_ticket_numbers IS NOT NULL AND array_length(p_ticket_numbers, 1) > 0 THEN
    -- Validate requested numbers
    IF array_length(p_ticket_numbers, 1) != p_quantity THEN
      RETURN jsonb_build_object('success', false, 'error', 'Number of selected tickets must match quantity');
    END IF;

    v_requested := ARRAY(SELECT DISTINCT unnest(p_ticket_numbers));
    IF array_length(v_requested, 1) != p_quantity THEN
      RETURN jsonb_build_object('success', false, 'error', 'Duplicate ticket numbers not allowed');
    END IF;

    FOREACH v_num IN ARRAY v_requested LOOP
      IF v_num < 1 OR v_num > v_raffle.max_entries THEN
        RETURN jsonb_build_object('success', false, 'error', 'Ticket number ' || v_num || ' is out of range (1-' || v_raffle.max_entries || ')');
      END IF;
      IF v_num = ANY(v_sold) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Ticket number ' || v_num || ' is already sold');
      END IF;
    END LOOP;

    -- Insert with selected numbers
    FOREACH v_num IN ARRAY v_requested LOOP
      INSERT INTO public.raffle_entries (raffle_id, member_id, quantity, total_paid, ticket_number)
      VALUES (p_raffle_id, v_member_id, 1, v_raffle.ticket_price, v_num);
    END LOOP;
    v_ticket_start := v_requested[1];
  ELSE
    -- Original behavior: assign next sequential numbers
    v_ticket_start := v_raffle.total_entries + 1;
    FOR v_i IN 1..p_quantity LOOP
      INSERT INTO public.raffle_entries (raffle_id, member_id, quantity, total_paid, ticket_number)
      VALUES (p_raffle_id, v_member_id, 1, v_raffle.ticket_price, v_raffle.total_entries + v_i);
    END LOOP;
  END IF;

  -- Update raffle total_entries
  UPDATE public.raffles
  SET total_entries = total_entries + p_quantity
  WHERE id = p_raffle_id;

  -- Deduct star bids from member
  v_new_balance := v_member_star_bids - v_cost;
  UPDATE public.members
  SET star_bids = v_new_balance,
      star_bids_consumed = COALESCE(star_bids_consumed, 0) + v_cost
  WHERE id = v_member_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'You entered the raffle with ' || p_quantity || ' ticket(s)!',
    'ticketCount', p_quantity,
    'totalCost', v_cost,
    'newStarBids', v_new_balance,
    'ticketStart', v_ticket_start
  );
END;
$$;

-- Grant execute (signature changed - drop and recreate grants if needed)
GRANT EXECUTE ON FUNCTION public.enter_raffle_secure(UUID, INTEGER, INTEGER[]) TO authenticated;
