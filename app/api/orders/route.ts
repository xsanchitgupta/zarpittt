import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUser } from '@/lib/user-auth';
import { verifyAdmin } from '@/lib/admin-auth';
import BookingService from '@/lib/services/booking-service';
import { initEventHandlers } from '@/lib/services/event-handlers';

// Initialize event handlers once
initEventHandlers();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  // ... (keeping GET as is)
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const all = searchParams.get('all');
    const professionalId = searchParams.get('professionalId');

    if (!id && !userId && !all && !professionalId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (all) {
      if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const { data, error } = await supabaseAdmin
        .from('bookings')
        .select('*, booking_items(*, service:service_id(included, not_included, duration, categories:category_id(name))), profile:profiles(full_name, email, phone)')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    if (userId) {
      if (!(await verifyUser(req, userId))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .select('*, booking_items(*, service:service_id(included, not_included, duration, categories:category_id(name)))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    if (professionalId) {
      if (!(await verifyUser(req, professionalId))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .select('*, booking_items(*, service:service_id(included, not_included, duration, categories:category_id(name))), profile:profiles(full_name, email, phone)')
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false });
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    let query = supabaseAdmin
      .from('bookings')
      .select('*, booking_items(*, service:service_id(included, not_included, duration, categories:category_id(name)))');

    if (id && id.startsWith('ZRP-')) {
      query = query.eq('booking_number', id);
    } else if (id) {
      query = query.eq('id', id);
    }

    const { data: booking, error } = await query.maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const isOwner = await verifyUser(req, booking.user_id);
    const isAssignedProfessional = booking.professional_id ? await verifyUser(req, booking.professional_id) : false;

    if (!isOwner && !isAssignedProfessional) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch professional details if assigned
    let professional = null;
    if (booking.professional_id) {
      const { data: provData } = await supabaseAdmin
        .from('provider_profiles')
        .select('id, user_id, account_name')
        .eq('user_id', booking.professional_id)
        .maybeSingle();
      
      if (provData) {
        const { data: profileData } = await supabaseAdmin
          .from('profiles')
          .select('full_name, avatar_url, phone')
          .eq('id', provData.user_id)
          .maybeSingle();
        
        if (profileData) {
          professional = { ...provData, profiles: profileData };
        } else if (provData.account_name) {
          professional = { ...provData, profiles: { full_name: provData.account_name } };
        }
      }
    }

    return NextResponse.json({ ...booking, professional });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.userId) {
      return NextResponse.json({ error: 'Missing userId in body' }, { status: 400 });
    }
    if (!(await verifyUser(req, body.userId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const result = await BookingService.createBooking(body);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[API] Order creation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, userId, professionalId } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing booking id' }, { status: 400 });
    }

    const isAdmin = await verifyAdmin(req);
    
    // Fetch the booking to verify ownership if not admin
    let bookingToUpdate = null;
    if (!isAdmin) {
      const { data, error } = await supabaseAdmin.from('bookings').select('user_id').eq('id', id).maybeSingle();
      if (error || !data) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      
      if (!(await verifyUser(req, data.user_id))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // Regular users can only cancel their own bookings
      if (status !== 'cancelled' || professionalId !== undefined) {
        return NextResponse.json({ error: 'Unauthorized action' }, { status: 401 });
      }
    }

    const updateData: any = { 
      updated_at: new Date().toISOString() 
    };
    if (status) updateData.status = status;
    if (professionalId !== undefined) updateData.professional_id = professionalId;

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add to status log if status changed
    if (status) {
      await supabaseAdmin.from('booking_status_log').insert({
        booking_id: id,
        new_status: status,
        changed_by: userId || 'system',
        notes: `Status updated to ${status} via API`,
      });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await verifyAdmin(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing booking id' }, { status: 400 });
    }

    // Explicitly delete from all potential child tables first to prevent constraint violations
    // on deployed databases where foreign key constraints are not set to cascade delete.
    await Promise.all([
      supabaseAdmin.from('booking_status_log').delete().eq('booking_id', id),
      supabaseAdmin.from('booking_items').delete().eq('booking_id', id),
      supabaseAdmin.from('payments').delete().eq('booking_id', id),
      supabaseAdmin.from('chat_messages').delete().eq('booking_id', id),
      supabaseAdmin.from('task_assignments').delete().eq('booking_id', id),
    ]);

    // Finally, delete the parent booking record
    const { error } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
