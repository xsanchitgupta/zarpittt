import { redirect } from 'next/navigation';
import MaintenanceView from '@/components/MaintenanceView';

export const dynamic = 'force-dynamic';

async function checkMaintenanceMode() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return 'false';

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/system_settings?select=*`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      next: { revalidate: 0 } // Bypass caches on check
    });

    if (!res.ok) throw new Error('Failed to fetch settings');
    const data = await res.json();
    return data.find((s: any) => s.key === 'maintenance_mode')?.value || 'false';
  } catch (err) {
    console.error('[MaintenancePage] Check error:', err);
    return 'false';
  }
}

export default async function MaintenancePage() {
  const maintenanceMode = await checkMaintenanceMode();
  if (maintenanceMode === 'false') {
    redirect('/');
  }

  return <MaintenanceView />;
}
