import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from "@/lib/admin-auth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Runs a services write, and if Postgres rejects it because a column doesn't
 * exist in this database (schema drift, e.g. gallery_images/video_url not yet
 * migrated), it strips that column and retries — so the rest of the update
 * (like the price) still saves instead of the whole request failing.
 * Returns the dropped column names so we can warn the admin.
 */
async function writeWithColumnFallback(
  run: (payload: Record<string, any>) => PromiseLike<{ data: any; error: any }>,
  payload: Record<string, any>
): Promise<{ data: any; error: any; droppedColumns: string[] }> {
  const working = { ...payload };
  const dropped: string[] = [];
  for (let attempt = 0; attempt < 8; attempt++) {
    const { data, error } = await run(working);
    if (!error) return { data, error: null, droppedColumns: dropped };
    // PGRST204: "Could not find the 'X' column of 'services' in the schema cache"
    const match = error.message?.match(/Could not find the '([^']+)' column/i);
    if (match && match[1] in working) {
      delete working[match[1]];
      dropped.push(match[1]);
      continue;
    }
    return { data, error, droppedColumns: dropped };
  }
  return { data: null, error: { message: 'Too many unknown columns' }, droppedColumns: dropped };
}

export async function GET(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*, categories(name, slug)')
      .order('is_coming_soon', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export async function PATCH(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, ...updates } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing service ID' }, { status: 400 });

    const { data, error, droppedColumns } = await writeWithColumnFallback(
      (payload) => supabaseAdmin.from('services').update(payload).eq('id', id).select().single(),
      updates
    );

    if (error) throw error;
    revalidatePath('/services');
    revalidatePath('/');
    // Surface a non-fatal warning if some fields couldn't be saved (missing DB columns)
    return NextResponse.json({ ...data, _warning: droppedColumns.length ? `Saved, but these fields were skipped (column missing in DB): ${droppedColumns.join(', ')}. Run supabase_services_media_columns.sql to enable them.` : undefined });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await req.json();

    const { data, error, droppedColumns } = await writeWithColumnFallback(
      (p) => supabaseAdmin.from('services').insert([p]).select().single(),
      payload
    );

    if (error) throw error;
    revalidatePath('/services');
    revalidatePath('/');
    return NextResponse.json({ ...data, _warning: droppedColumns.length ? `Created, but these fields were skipped (column missing in DB): ${droppedColumns.join(', ')}. Run supabase_services_media_columns.sql to enable them.` : undefined });
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
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing service ID' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    revalidatePath('/services');
    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
