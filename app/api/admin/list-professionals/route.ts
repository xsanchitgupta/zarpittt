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
      .order('created_at', { ascending: false });

    if (pError) throw pError;

    const userIds = providers.map(p => p.user_id).filter(Boolean);
    const { data: profiles } = await supabaseAdmin.from('profiles').select('*').in('id', userIds);
    const profileMap = new Map();
    profiles?.forEach(p => profileMap.set(p.id, p));

    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('professional_id, status, total')
      .in('professional_id', userIds);

    const statsMap = new Map();
    userIds.forEach(id => statsMap.set(id, { total_jobs: 0, assigned_jobs: 0, earnings: 0 }));

    if (bookings) {
      bookings.forEach(b => {
        const stat = statsMap.get(b.professional_id);
        if (stat) {
          if (b.status === 'completed') {
            stat.total_jobs += 1;
            stat.earnings += b.total || 0;
          } else if (['confirmed', 'en_route', 'in_progress'].includes(b.status)) {
            stat.assigned_jobs += 1;
          }
        }
      });
    }

    // Fetch all services to map IDs to Names
    const { data: allServices } = await supabaseAdmin.from('services').select('id, name');
    const serviceMap = new Map();
    allServices?.forEach(s => serviceMap.set(s.id, s.name));

    // Map UUIDs to Names
    const merged = providers.map(p => {
      const offered = Array.isArray(p.services_offered) ? p.services_offered : [];
      return {
        ...p,
        profile: profileMap.get(p.user_id) || null,
        stats: statsMap.get(p.user_id) || { total_jobs: 0, assigned_jobs: 0, earnings: 0 },
        rating: p.rating || 0,
        service_names: offered.map((id: string) => {
          const trimmedId = id.trim();
          return serviceMap.get(trimmedId) || trimmedId;
        })
      };
    });

    return NextResponse.json(merged);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
