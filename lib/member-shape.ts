/**
 * Map Supabase member row to Wix-compatible shape for AuctionWallet, PaymentPopup, etc.
 */
export function toMemberShape(row: {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  star_bids?: number;
  star_bids_consumed?: number;
  phone?: string | null;
  shipping_address?: string | null;
  shipping_city?: string | null;
  shipping_postal_code?: string | null;
  shipping_country?: string | null;
}) {
  const starBids = Number(row.star_bids) ?? 0;
  const starBidsConsumed = Number(row.star_bids_consumed) ?? 0;
  return {
    _id: row.id,
    memberId: row.id,
    memberemail: row.email,
    memberEmail: row.email,
    memberName: row.full_name ?? row.email?.split('@')[0] ?? '',
    memberUsername: row.full_name ?? row.email?.split('@')[0] ?? 'Guest',
    starBids,
    starBidsConsumed,
    memberTag: row.role,
    memberPhone: row.phone || '',
    memberPhonecode: '',
    shippingAddress: row.shipping_address || '',
    shippingCity: row.shipping_city || '',
    shippingPostalCode: row.shipping_postal_code || '',
    shippingCountry: row.shipping_country || '',
  };
}
