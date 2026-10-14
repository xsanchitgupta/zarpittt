'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';

// ==========================================
// PUBLIC ACTIONS
// ==========================================

export async function getPublishedBlogs() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching blogs:', error);
    return [];
  }
  return data;
}

export async function getBlogBySlug(slug: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  return data;
}

// ==========================================
// ADMIN ACTIONS
// ==========================================

export async function getAllBlogs() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function getBlogById(id: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

function generateSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export async function createBlog(formData: FormData) {
  try {
    const supabase = createServerSupabaseClient();
    const title = formData.get('title') as string;
    const is_published = formData.get('is_published') === 'true';
    
    const data = {
      title,
      slug: formData.get('slug') || generateSlug(title),
      excerpt: formData.get('excerpt'),
      content: formData.get('content'),
      image_url: formData.get('image_url') || '',
      author: formData.get('author') || 'Zarpit Team',
      category: formData.get('category'),
      is_published,
      published_at: is_published ? new Date().toISOString() : null
    };

    const { error } = await supabase.from('blogs').insert([data]);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateBlog(id: string, formData: FormData) {
  try {
    const supabase = createServerSupabaseClient();
    const is_published = formData.get('is_published') === 'true';
    
    // First get current blog to check if we are publishing it for the first time
    const { data: currentBlog } = await supabase.from('blogs').select('is_published, published_at').eq('id', id).single();
    
    let published_at = currentBlog?.published_at;
    if (is_published && !currentBlog?.is_published) {
      published_at = new Date().toISOString();
    }

    const data = {
      title: formData.get('title'),
      slug: formData.get('slug'),
      excerpt: formData.get('excerpt'),
      content: formData.get('content'),
      image_url: formData.get('image_url') || '',
      author: formData.get('author') || 'Zarpit Team',
      category: formData.get('category'),
      is_published,
      published_at,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('blogs').update(data).eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteBlog(id: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('blogs').delete().eq('id', id);
  return { success: !error, error: error?.message };
}
