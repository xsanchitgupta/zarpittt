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
    // 1. User Count and Creation Dates
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('created_at');
    const userCount = profiles?.length || 0;

    // 2. Service Count
    const { count: serviceCount } = await supabaseAdmin
      .from('services')
      .select('id', { count: 'exact', head: true });

    // 3. System Settings
    const { data: settings } = await supabaseAdmin
      .from('system_settings')
      .select('*');

    // 4. Booking Stats
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('total, status, created_at');

    let stats = {
      userCount,
      serviceCount: serviceCount || 0,
      settings: settings || [],
      revenueStats: {
        totalRevenue: 0,
        todayRevenue: 0,
        todayBookings: 0,
        pending: 0,
        active: 0,
        completed: 0,
        totalStatsBookings: 0,
        revenueTrend: '0.0%',
        revenueTrendUp: true,
        bookingsTrend: '0.0%',
        bookingsTrendUp: true,
        usersTrend: '0.0%',
        usersTrendUp: true,
        todayRevenueTrend: 'No orders',
        todayRevenueTrendUp: false
      }
    };

    if (bookings) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Filtering bookings for time periods
      const todayB = bookings.filter(b => new Date(b.created_at) >= startOfToday);
      const yesterdayB = bookings.filter(b => {
        const d = new Date(b.created_at);
        return d >= startOfYesterday && d < startOfToday;
      });

      const current7DaysB = bookings.filter(b => new Date(b.created_at) >= sevenDaysAgo);
      const previous7DaysB = bookings.filter(b => {
        const d = new Date(b.created_at);
        return d >= fourteenDaysAgo && d < sevenDaysAgo;
      });

      // Revenue sums (excluding cancelled bookings)
      const totalRevenue = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.total, 0);
      const todayRevenue = todayB.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.total, 0);
      const yesterdayRevenue = yesterdayB.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.total, 0);

      const current7DaysRevenue = current7DaysB.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.total, 0);
      const previous7DaysRevenue = previous7DaysB.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.total, 0);

      // Helper function to calculate percentage increase
      const getPercentageIncrease = (curr: number, prev: number) => {
        if (prev === 0) {
          return curr > 0 ? 100 : 0;
        }
        return ((curr - prev) / prev) * 100;
      };

      // Calculate trend values
      const revTrendVal = getPercentageIncrease(current7DaysRevenue, previous7DaysRevenue);
      const bookTrendVal = getPercentageIncrease(current7DaysB.length, previous7DaysB.length);
      
      const current7DaysUsers = (profiles || []).filter(p => new Date(p.created_at) >= sevenDaysAgo).length;
      const previous7DaysUsers = (profiles || []).filter(p => {
        const d = new Date(p.created_at);
        return d >= fourteenDaysAgo && d < sevenDaysAgo;
      }).length;
      const userTrendVal = getPercentageIncrease(current7DaysUsers, previous7DaysUsers);

      const todayRevTrendVal = getPercentageIncrease(todayRevenue, yesterdayRevenue);

      stats.revenueStats = {
        totalRevenue,
        todayRevenue,
        todayBookings: todayB.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        active: bookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        totalStatsBookings: bookings.length,
        
        revenueTrend: `${Math.abs(revTrendVal).toFixed(1)}%`,
        revenueTrendUp: revTrendVal >= 0,
        
        bookingsTrend: `${Math.abs(bookTrendVal).toFixed(1)}%`,
        bookingsTrendUp: bookTrendVal >= 0,
        
        usersTrend: `${Math.abs(userTrendVal).toFixed(1)}%`,
        usersTrendUp: userTrendVal >= 0,
        
        todayRevenueTrend: todayB.length > 0 
          ? `${Math.abs(todayRevTrendVal).toFixed(1)}% vs yesterday` 
          : 'No orders',
        todayRevenueTrendUp: todayB.length > 0 && todayRevTrendVal >= 0
      };
    }

    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
