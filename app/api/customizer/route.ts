import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { convertWixImageUrl } from '@/lib/wix-utils';

// Phase 5: raw_hats and hat_accessories from Supabase
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const collection = searchParams.get('collection');

    if (!action || !collection) {
      return NextResponse.json({ success: false, error: 'Missing action or collection' }, { status: 400 });
    }

    if (action === 'getRawHats') {
      const hatForm = searchParams.get('hatForm');
      const supabase = await createClient();
      let query = supabase.from('raw_hats').select('*');
      if (hatForm) {
        query = query.eq('hat_form', hatForm);
      }
      const { data: rows, error } = await query.limit(1000);
      if (error) {
        console.error('getRawHats error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      const rawItems = rows || [];
      const items = rawItems.map((r: any) => {
        const hatColor = r.hat_color || [];
        const arr = Array.isArray(hatColor) ? hatColor.filter((c: any) => c && typeof c === 'string') : [];
        const primaryColor = arr[0] || r.hat_color_hex || '';
        return {
          _id: r.wix_id,
          hatForm: r.hat_form || hatForm || '',
          hatColor: arr,
          hatColorHex: primaryColor,
          hatColorName: r.hat_color_name || '',
          hatProductName: r.hat_product_name || '',
          hatProductImage: convertWixImageUrl(r.hat_product_image) || r.hat_product_image || '',
          rawHatPrice: Number(r.raw_hat_price) || 0,
          rawHatId: r.raw_hat_id || r.wix_id,
        };
      });
      return NextResponse.json({ success: true, items });
    }

    if (action === 'getUniqueHatForms') {
      const supabase = await createClient();
      const { data: rows } = await supabase.from('raw_hats').select('hat_form').limit(500);
      const uniqueForms = [...new Set((rows || []).map((r: any) => r.hat_form).filter(Boolean))];
      return NextResponse.json({ success: true, hatForms: uniqueForms });
    }

    if (action === 'getAccessories') {
      const accessoryType = searchParams.get('accessoryType');
      const supabase = await createClient();
      let query = supabase.from('hat_accessories').select('*');
      if (accessoryType) query = query.eq('accessory_type', accessoryType);
      const { data: rows } = await query.limit(100);
      const items = (rows || []).map((r: any) => ({
        _id: r.wix_id,
        accessoryType: r.accessory_type,
        accessoryTags: r.accessory_tags || [],
        title: r.title,
        imageUrl: r.image_url,
        price: Number(r.price) || 0,
      }));
      return NextResponse.json({ success: true, items });
    }

    if (action === 'getArtCreation') {
      const { getArtCreationFromSupabase } = await import('@/lib/supabase-config');
      const item = await getArtCreationFromSupabase();
      return NextResponse.json({ success: true, item });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Customizer API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'saveCustomizedOrder') {
      const { hats, clientNotes, memberEmail, name, email, mobile, address, shippingPrice, shippingType, paymentMethod, finalTotalPrice, orderPaid } = data;

      if (!hats || !Array.isArray(hats) || hats.length === 0) {
        return NextResponse.json({ success: false, error: 'No hats provided' }, { status: 400 });
      }

      try {
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const supabase = createAdminClient();

        let groupOrderId = 'CHCustomOrder1';
        const { data: existing } = await supabase.from('customized_hat_orders').select('group_order_id').limit(1000);
        if (existing && existing.length > 0) {
          let maxNum = 0;
          existing.forEach((o: any) => {
            const m = (o.group_order_id || '').match(/CHCustomOrder(\d+)/);
            if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
          });
          if (maxNum > 0) groupOrderId = `CHCustomOrder${maxNum + 1}`;
        }

        let phoneCode = '';
        let phoneNumber = mobile || '';
        if (mobile) {
          const m = mobile.match(/^(\+\d{1,4})\s*(.+)$/);
          if (m) {
            phoneCode = m[1];
            phoneNumber = m[2];
          } else {
            phoneCode = '+1';
          }
        }

        const customerName = name || '';
        const customerEmail = email || memberEmail || '';
        const customerAddress = address || '';
        const savedIds: string[] = [];

        for (const hat of hats) {
          const emb = hat.embellishments || {};
          const basePrice = hat.rawHatPrice || 0;
          const indvTotal = basePrice + (emb.artPrice || 0) + (emb.preciousStonesPrice || 0) + (emb.jewelryPrice || 0) + (emb.fabricPrice || 0);

          const row = {
            group_order_id: groupOrderId,
            hat_form: Array.isArray(hat.hatForm) ? hat.hatForm : [hat.hatForm || ''],
            hat_color_name: hat.hatColorName || '',
            hat_product_image: hat.hatProductImage || '',
            raw_hat_price: basePrice,
            raw_hat_id: hat.rawHatId || hat._id,
            art: emb.art || '',
            art_colors: emb.artColors || '',
            art_description: emb.artDescription || '',
            precious_stones: emb.preciousStones || '',
            precious_stone_type: emb.preciousStoneType || '',
            jewelry: emb.jewelry || '',
            jewelry_type: emb.jewelryType || '',
            fabric: emb.fabric || '',
            notes: emb.notes || '',
            birth_date: emb.birthDate || '',
            client_description: clientNotes || '',
            indv_raw_hat_n_accessory_total_live_price: indvTotal,
            email: customerEmail,
            name: customerName,
            mobile: phoneNumber,
            phone_code: phoneCode,
            address: customerAddress,
            shipping_price: shippingPrice || 0,
            shipping_type: shippingType || '',
            final_total_price: finalTotalPrice || indvTotal,
            payment_method: paymentMethod || '',
            order_paid: orderPaid || false,
            order_created_on: new Date().toISOString(),
          };

          const { data: inserted, error } = await supabase.from('customized_hat_orders').insert(row).select('id').single();
          if (error) throw error;
          if (inserted?.id) savedIds.push(inserted.id);
        }

        // Send order confirmation email when paid (fire-and-forget)
        if (orderPaid && customerEmail) {
          const subtotal = hats.reduce((sum: number, h: any) => {
            const emb = h.embellishments || {};
            const base = h.rawHatPrice || 0;
            return sum + base + (emb.artPrice || 0) + (emb.preciousStonesPrice || 0) + (emb.jewelryPrice || 0) + (emb.fabricPrice || 0);
          }, 0);
          const esc = (s: string) => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          const hatsSummary = hats.map((h: any, i: number) => {
            const form = esc(Array.isArray(h.hatForm) ? h.hatForm[0] : h.hatForm || 'Custom');
            const color = esc(h.hatColorName || '');
            const art = h.embellishments?.art ? ` · ${esc(h.embellishments.art)}` : '';
            return `${i + 1}. ${form}${color ? ` ${color}` : ''}${art}`;
          }).join('<br>');
          const { sendCustomOrderConfirmationEmail } = await import('@/lib/email');
          sendCustomOrderConfirmationEmail({
            to: customerEmail.toLowerCase().trim(),
            name: customerName || 'Customer',
            groupOrderId,
            hatCount: hats.length,
            hatsSummary,
            subtotal,
            shippingCost: Number(shippingPrice) || 0,
            totalPrice: Number(finalTotalPrice) || subtotal + Number(shippingPrice || 0),
            shippingAddress: customerAddress || '',
            shippingType: shippingType || undefined,
          }).catch((e) => console.error('Custom order confirmation email failed:', e));

          const { sendAdminOrderNotification } = await import('@/lib/email');
          const itemSummary = hats.map((h: any, i: number) => {
            const form = esc(Array.isArray(h.hatForm) ? h.hatForm[0] : h.hatForm || 'Custom');
            const color = esc(h.hatColorName || '');
            const art = h.embellishments?.art ? ` · ${esc(h.embellishments.art)}` : '';
            return `${i + 1}. ${form}${color ? ` ${color}` : ''}${art}`;
          }).join(' | ');
          sendAdminOrderNotification({
            orderType: 'custom',
            customerName: customerName || 'Customer',
            customerEmail: customerEmail.toLowerCase().trim(),
            orderId: groupOrderId,
            itemSummary: itemSummary || `${hats.length} custom hat(s)`,
            totalPrice: Number(finalTotalPrice) || subtotal + Number(shippingPrice || 0),
            shippingAddress: customerAddress || '—',
          }).catch((e) => console.error('Admin notification failed:', e));
        }

        return NextResponse.json({ success: true, message: 'Order saved', groupOrderId, savedCount: savedIds.length });
      } catch (error: any) {
        console.error('❌ Error saving custom order:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to save order' }, { status: 500 });
      }
    }

    if (action === 'updateArtCreation') {
      const { artPriceIncreasedTotal, artPriceFinalTotal } = data;
      try {
        const { updateArtCreationInSupabase } = await import('@/lib/supabase-config');
        await updateArtCreationInSupabase({
          ...(artPriceIncreasedTotal != null && { artPriceIncreasedTotal: Number(artPriceIncreasedTotal) }),
          ...(artPriceFinalTotal != null && { artPriceFinalTotal: Number(artPriceFinalTotal) }),
        });
        return NextResponse.json({ success: true });
      } catch (error: any) {
        console.warn(`⚠️ Failed to update ArtCreation: ${error?.message}`);
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Customizer API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save data' },
      { status: 500 }
    );
  }
}
