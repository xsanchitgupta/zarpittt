'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import supabase from '@/lib/supabase';
import { DollarSign, Briefcase, Star, Clock, MapPin, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function ProviderDashboard() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // In a real app this would fetch jobs assigned to the provider ID via Supabase.
  // For the MVP, we just fetch confirmed bookings for display.
  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, profiles:user_id(full_name, phone)')
        .in('status', ['confirmed', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) setJobs(data);
      setLoading(false);
    };
    fetchJobs();
  }, []);

  const stats = [
    { label: "Today's Earnings", value: '₹1,250', icon: DollarSign, color: 'text-success', bg: 'rgba(34,197,94,0.1)' },
    { label: 'Active Jobs', value: jobs.length.toString(), icon: Briefcase, color: 'text-accent', bg: 'var(--accent-light)' },
    { label: 'Avg Rating', value: '4.8', icon: Star, color: 'text-warning', bg: 'rgba(234,179,8,0.1)' },
    { label: 'Completed', value: '142', icon: CheckCircle2, color: 'text-blue-500', bg: 'rgba(59,130,246,0.1)' },
  ];

  return (
    <div>
      <div style={{marginBottom:32}}>
        <h1 style={{fontFamily:'var(--font-heading)',fontSize:'2rem',fontWeight:700,marginBottom:8}}>Welcome back, {profile?.full_name?.split(' ')[0] || 'Professional'}!</h1>
        <p style={{color:'var(--text-secondary)',fontSize:15}}>Here is what is happening with your tasks today.</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',gap:20,marginBottom:40}}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} style={{padding:24,background:'var(--glass-bg)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-xl)',backdropFilter:'blur(20px)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <div style={{width:48,height:48,borderRadius:'var(--radius-lg)',background:stat.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Icon size={24} style={{color: stat.color === 'text-success' ? 'var(--success)' : stat.color === 'text-accent' ? 'var(--accent)' : stat.color === 'text-warning' ? 'var(--warning)' : '#3b82f6'}} />
                </div>
              </div>
              <div style={{fontFamily:'var(--font-heading)',fontSize:'2rem',fontWeight:800,marginBottom:4}}>{stat.value}</div>
              <p style={{fontSize:14,color:'var(--text-muted)'}}>{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:24}}>
        {/* Main Jobs View */}
        <div style={{background:'var(--glass-bg)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-2xl)',padding:32,backdropFilter:'blur(20px)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
            <h2 style={{fontFamily:'var(--font-heading)',fontSize:'1.3rem',fontWeight:700}}>Up Next</h2>
            <Link href="/provider/jobs" style={{fontSize:13,color:'var(--accent)',fontWeight:500}}>View All Jobs</Link>
          </div>

          {loading ? (
            <div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div style={{textAlign:'center',padding:40,border:'1px dashed var(--border)',borderRadius:'var(--radius-xl)'}}>
              <Briefcase size={32} style={{margin:'0 auto 16px',color:'var(--text-muted)'}} />
              <p style={{fontWeight:500,marginBottom:8}}>No active jobs right now</p>
              <p style={{fontSize:14,color:'var(--text-secondary)'}}>You are all caught up for the day!</p>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {jobs.map(job => (
                <div key={job.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:20,border:'1px solid var(--border)',borderRadius:'var(--radius-xl)',background:'var(--bg-card-solid)'}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                      <span className="badge badge-accent" style={{fontSize:11}}>{job.status}</span>
                      <span style={{fontSize:13,fontWeight:600}}>#{job.booking_number}</span>
                    </div>
                    <h3 style={{fontSize:16,fontWeight:600,marginBottom:8}}>{job.profiles?.full_name || 'Customer'}</h3>
                    <div style={{display:'flex',alignItems:'center',gap:16,fontSize:13,color:'var(--text-secondary)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:4}}><Clock size={14} /> Today, {job.scheduled_time || '10:00 AM'}</div>
                      <div style={{display:'flex',alignItems:'center',gap:4}}><MapPin size={14} /> {job.address?.split(',')[0] || 'Delhi'}</div>
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" style={{display:'flex',alignItems:'center',gap:6}}>
                    Start Job <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar widgets */}
        <div style={{display:'flex',flexDirection:'column',gap:24}}>
          <div style={{background:'var(--glass-bg)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-2xl)',padding:28,backdropFilter:'blur(20px)'}}>
            <h3 style={{fontFamily:'var(--font-heading)',fontSize:'1.1rem',fontWeight:600,marginBottom:16}}>Availability</h3>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:16,background:'var(--bg-card-solid)',borderRadius:'var(--radius-lg)',border:'1px solid var(--border)'}}>
              <div>
                <div style={{fontWeight:600,fontSize:14,marginBottom:4}}>Accepting Jobs</div>
                <div style={{fontSize:12,color:'var(--text-secondary)'}}>You are visible to customers</div>
              </div>
              <div style={{width:44,height:24,borderRadius:12,background:'var(--success)',position:'relative'}}>
                <div style={{position:'absolute',top:2,right:2,width:20,height:20,background:'#fff',borderRadius:'50%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add the missing CheckCircle2 import locally for this file
import { CheckCircle2 } from 'lucide-react';
