import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from "@/lib/admin-auth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * SECURITY: Only these tables can be modified through the settings API.
 * This prevents an admin-level IDOR where the `table` param could target
 * sensitive tables like `profiles`, `bookings`, or `auth.users`.
 */
const ALLOWED_TABLES = ['site_settings', 'service_areas', 'testimonials', 'system_settings', 'notifications'];

function isAllowedTable(table: string | null): table is string {
  return typeof table === 'string' && ALLOWED_TABLES.includes(table);
}

export async function GET(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [s, a, t, sys] = await Promise.all([
      supabaseAdmin.from('site_settings').select('*'),
      supabaseAdmin.from('service_areas').select('*').order('name'),
      supabaseAdmin.from('testimonials').select('*').order('id'),
      supabaseAdmin.from('system_settings').select('*'),
    ]);

    return NextResponse.json({
      site_settings: s.data || [],
      service_areas: a.data || [],
      testimonials: t.data || [],
      system_settings: sys.data || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { table, updates, key, id } = await req.json();

    if (!isAllowedTable(table)) {
      return NextResponse.json({ error: `Forbidden: table '${table}' is not allowed` }, { status: 403 });
    }

    let query = supabaseAdmin.from(table).update(updates);
    
    if (key) query = query.eq('key', key);
    if (id) query = query.eq('id', id);

    const { data, error } = await query.select();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { table, data } = await req.json();

    if (!isAllowedTable(table)) {
      return NextResponse.json({ error: `Forbidden: table '${table}' is not allowed` }, { status: 403 });
    }

    const { data: result, error } = await supabaseAdmin.from(table).insert(data).select();

    if (error) throw error;
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const table = searchParams.get('table');
    const id = searchParams.get('id');

    if (!isAllowedTable(table)) {
      return NextResponse.json({ error: `Forbidden: table '${table}' is not allowed` }, { status: 403 });
    }

    if (!id) throw new Error('Missing id');

    const { error } = await supabaseAdmin.from(table).delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use for upserting system settings
  try {
    const { table, data } = await req.json();

    if (!isAllowedTable(table)) {
      return NextResponse.json({ error: `Forbidden: table '${table}' is not allowed` }, { status: 403 });
    }

    const { data: upsertData, error } = await supabaseAdmin.from(table).upsert(data).select();
    if (error) throw error;
    return NextResponse.json(upsertData);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
