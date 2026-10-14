'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';

// ==========================================
// PUBLIC ACTIONS
// ==========================================

export async function getActiveCareers() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('careers')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching careers:', error);
    return [];
  }
  return data;
}

export async function submitJobApplication(formData: FormData) {
  try {
    const career_id = formData.get('career_id') as string;
    const full_name = formData.get('full_name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const experience = formData.get('experience') as string;
    const resume_url = formData.get('resume_url') as string;

    if (!career_id || !full_name || !email || !phone || !resume_url) {
      return { success: false, error: 'Missing required fields' };
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from('job_applications').insert([{
      career_id,
      full_name,
      email,
      phone,
      experience,
      resume_url
    }]);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Job application error:', err);
    return { success: false, error: err.message };
  }
}

// ==========================================
// ADMIN ACTIONS
// ==========================================

export async function getAllCareers() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('careers')
    .select('*')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function getCareerById(id: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('careers')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

export async function getApplicationsForCareer(career_id: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .eq('career_id', career_id)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function createCareer(formData: FormData) {
  try {
    const supabase = createServerSupabaseClient();
    const data = {
      title: formData.get('title'),
      category: formData.get('category'),
      type: formData.get('type'),
      location: formData.get('location'),
      description: formData.get('description'),
      is_active: formData.get('is_active') === 'true'
    };

    const { error } = await supabase.from('careers').insert([data]);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateCareer(id: string, formData: FormData) {
  try {
    const supabase = createServerSupabaseClient();
    const data = {
      title: formData.get('title'),
      category: formData.get('category'),
      type: formData.get('type'),
      location: formData.get('location'),
      description: formData.get('description'),
      is_active: formData.get('is_active') === 'true',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('careers').update(data).eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteCareer(id: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('careers').delete().eq('id', id);
  return { success: !error, error: error?.message };
}

export async function updateApplicationStatus(id: string, status: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('job_applications').update({ status }).eq('id', id);
  return { success: !error, error: error?.message };
}
