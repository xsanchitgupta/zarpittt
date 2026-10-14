import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .select('*');

    if (error) throw error;

    const maintenanceMode = data.find(s => s.key === 'maintenance_mode')?.value || 'false';
    const reason = data.find(s => s.key === 'maintenance_reason')?.value || '';
    const eta = data.find(s => s.key === 'maintenance_eta')?.value || '';

    return NextResponse.json({
      maintenanceMode,
      reason,
      eta
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
