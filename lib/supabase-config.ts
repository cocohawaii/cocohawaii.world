/**
 * Supabase-backed app config (replaces Wix ArtCreation for global art price)
 */
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface ArtCreationConfig {
  artBasePrice: number;
  artPriceIncrease: string | number;
  increaseRate: number;
  artPriceIncreasedTotal?: number;
  artPriceFinalTotal?: number;
}

const DEFAULT_ART_CREATION: ArtCreationConfig = {
  artBasePrice: 100,
  artPriceIncrease: '0.01',
  increaseRate: 6400,
  artPriceIncreasedTotal: 0,
  artPriceFinalTotal: 100,
};

export async function getArtCreationFromSupabase(): Promise<ArtCreationConfig & { _id?: string }> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from('auction_config')
    .select('id, value')
    .eq('key', 'art_creation')
    .maybeSingle();
  if (error || !row) return { ...DEFAULT_ART_CREATION, _id: undefined };
  const v = (row.value as Record<string, unknown>) || {};
  const artPriceIncrease = (typeof v.artPriceIncrease === 'string' || typeof v.artPriceIncrease === 'number')
    ? v.artPriceIncrease
    : DEFAULT_ART_CREATION.artPriceIncrease;
  return {
    _id: row.id,
    artBasePrice: Number(v.artBasePrice) ?? DEFAULT_ART_CREATION.artBasePrice,
    artPriceIncrease,
    increaseRate: Number(v.increaseRate) ?? DEFAULT_ART_CREATION.increaseRate,
    artPriceIncreasedTotal: v.artPriceIncreasedTotal != null ? Number(v.artPriceIncreasedTotal) : undefined,
    artPriceFinalTotal: v.artPriceFinalTotal != null ? Number(v.artPriceFinalTotal) : undefined,
  };
}

export async function updateArtCreationInSupabase(updates: Partial<ArtCreationConfig>): Promise<void> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('auction_config')
    .select('value')
    .eq('key', 'art_creation')
    .maybeSingle();
  const current = (existing?.value as Record<string, unknown>) || {};
  const merged = {
    ...current,
    ...(updates.artBasePrice != null && { artBasePrice: updates.artBasePrice }),
    ...(updates.artPriceIncrease != null && { artPriceIncrease: String(updates.artPriceIncrease) }),
    ...(updates.increaseRate != null && { increaseRate: updates.increaseRate }),
    ...(updates.artPriceIncreasedTotal != null && { artPriceIncreasedTotal: updates.artPriceIncreasedTotal }),
    ...(updates.artPriceFinalTotal != null && { artPriceFinalTotal: updates.artPriceFinalTotal }),
  };
  const { error } = await admin
    .from('auction_config')
    .update({ value: merged, updated_at: new Date().toISOString() })
    .eq('key', 'art_creation');
  if (error) throw error;
}
