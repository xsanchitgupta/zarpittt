import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from "@/lib/admin-auth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: providers, error: pError } = await supabaseAdmin
      .from('provider_profiles')
      .select('*')
      .eq('worker_type', 'salaried')
      .order('created_at', { ascending: false });

    if (pError) throw pError;

    const userIds = providers.map(p => p.user_id).filter(Boolean);
    const { data: profiles } = await supabaseAdmin.from('profiles').select('*').in('id', userIds);
    const profileMap = new Map();
    profiles?.forEach(p => profileMap.set(p.id, p));

    const { data: assignments } = await supabaseAdmin
      .from('task_assignments')
      .select('worker_id, status, estimated_start, estimated_end')
      .in('status', ['assigned', 'in_progress']);

    const assignmentsMap = new Map();
    assignments?.forEach(a => {
      if (!assignmentsMap.has(a.worker_id)) assignmentsMap.set(a.worker_id, []);
      assignmentsMap.get(a.worker_id).push(a);
    });

    const result = providers.map(p => ({
      ...p,
      profile: profileMap.get(p.user_id) || null,
      active_tasks: assignmentsMap.get(p.user_id) || []
    }));

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
