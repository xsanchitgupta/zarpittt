'use client';

import { useState, useEffect } from 'react';
import { getAllBlogs, createBlog, updateBlog, deleteBlog } from '@/app/actions/blogs';
import { uploadImageToCloudinary } from '@/app/actions/image';
import { Plus, Trash2, Loader2, Save, Image as ImageIcon } from 'lucide-react';
import ToastContainer, { toast } from '@/components/Toast';
import Modal from '@/components/Modal';
import dynamic from 'next/dynamic';
import 'easymde/dist/easymde.min.css';

const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false });

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  // Inspector State
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);
  
  // Forms
  const [formData, setFormData] = useState({
    title: '', slug: '', excerpt: '', content: '', author: 'Zarpit Team', category: '', is_published: false, imageFile: null as File | null
  });
  
  const [editData, setEditData] = useState({
    title: '', slug: '', excerpt: '', content: '', author: '', category: '', is_published: false, imageFile: null as File | null
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const data = await getAllBlogs();
      setBlogs(data || []);
    } catch (err) {
      console.error('Fetch blogs error:', err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let imageUrl = '';
    if (formData.imageFile) {
      const fileData = new FormData();
      fileData.append('file', formData.imageFile);
      const res = await uploadImageToCloudinary(fileData);
      if (res.success && res.url) {
        imageUrl = res.url;
      } else {
        toast.error('Error', 'Image upload failed');
        setSaving(false);
        return;
      }
    }

    const fd = new FormData();
    fd.append('title', formData.title);
    if (formData.slug) fd.append('slug', formData.slug);
    fd.append('excerpt', formData.excerpt);
    fd.append('content', formData.content);
    fd.append('author', formData.author);
    fd.append('category', formData.category);
    fd.append('is_published', formData.is_published.toString());
    fd.append('image_url', imageUrl);

    const res = await createBlog(fd);
    
    if (res.success) {
      setIsAdding(false);
      setFormData({ title: '', slug: '', excerpt: '', content: '', author: 'Zarpit Team', category: '', is_published: false, imageFile: null });
      fetchBlogs();
      toast.success('Success', 'Blog added successfully');
    } else {
      toast.error('Error', 'Error creating blog: ' + res.error);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    
    const res = await deleteBlog(id);
    if (res.success) {
      toast.success('Deleted', 'Blog removed successfully');
      setSelectedBlogId(null);
      fetchBlogs();
    } else {
      toast.error('Error', 'Could not delete blog: ' + res.error);
    }
  };

  const openInspector = (blog: any) => {
    setSelectedBlogId(blog.id);
    setEditData({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      author: blog.author,
      category: blog.category,
      is_published: blog.is_published,
      imageFile: null
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedBlogId) return;
    setSaving(true);
    
    const currentBlog = blogs.find(b => b.id === selectedBlogId);
    let imageUrl = currentBlog.image_url;

    if (editData.imageFile) {
      const fileData = new FormData();
      fileData.append('file', editData.imageFile);
      const res = await uploadImageToCloudinary(fileData);
      if (res.success && res.url) {
        imageUrl = res.url;
      } else {
        toast.error('Error', 'Image upload failed');
        setSaving(false);
        return;
      }
    }

    const fd = new FormData();
    fd.append('title', editData.title);
    fd.append('slug', editData.slug);
    fd.append('excerpt', editData.excerpt);
    fd.append('content', editData.content);
    fd.append('author', editData.author);
    fd.append('category', editData.category);
    fd.append('is_published', editData.is_published.toString());
    fd.append('image_url', imageUrl);

    const res = await updateBlog(selectedBlogId, fd);
    
    if (res.success) {
      toast.success('Updated', 'Blog updated successfully');
      fetchBlogs();
      setSelectedBlogId(null);
    } else {
      toast.error('Error', 'Could not update blog: ' + res.error);
    }
    setSaving(false);
  };

  const selectedBlog = blogs.find(b => b.id === selectedBlogId);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <ToastContainer />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontSize: '2rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
          Blogs
        </h1>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--admin-text-primary)', color: 'var(--admin-surface)', borderRadius: 12, border: 'none', fontWeight: 600, cursor: 'pointer' }}
        >
          {isAdding ? 'Cancel' : <><Plus size={18} /> Add Blog</>}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="admin-glass-panel" style={{ padding: 24, marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: 8 }}>New Blog Post</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <input required placeholder="Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="admin-input" />
            <input placeholder="Slug (optional, auto-generated)" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} className="admin-input" />
            <input required placeholder="Category (e.g. Home Care)" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="admin-input" />
            <input required placeholder="Author" value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} className="admin-input" />
          </div>
          <div>
            <textarea required placeholder="Short Excerpt (shows on the blog list)" value={formData.excerpt} onChange={e => setFormData({ ...formData, excerpt: e.target.value })} className="admin-input" style={{ minHeight: 60, resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--admin-text-secondary)' }}>Full Markdown Content</label>
            <div style={{ background: '#fff', color: '#000', borderRadius: 8, overflow: 'hidden' }}>
              <SimpleMDE value={formData.content} onChange={val => setFormData({ ...formData, content: val })} options={{ placeholder: 'Write your blog here in Markdown...' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--admin-text-secondary)' }}>Cover Image</label>
            <input required type="file" accept="image/*" onChange={e => setFormData({ ...formData, imageFile: e.target.files?.[0] || null })} style={{ display: 'block', width: '100%', padding: 12, borderRadius: 8, border: '1px dashed var(--admin-border)', color: 'var(--admin-text-primary)' }} />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.is_published} onChange={e => setFormData({ ...formData, is_published: e.target.checked })} />
              <span style={{ fontSize: 14, color: 'var(--admin-text-primary)' }}>Published (Visible on website)</span>
            </label>
          </div>
          <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">
            {saving ? <Loader2 className="animate-spin" size={20} /> : 'Save Blog'}
          </button>
        </form>
      )}

      <div className="admin-glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-secondary)' }}><Loader2 className="animate-spin" style={{ margin: '0 auto' }} /></div>
        ) : blogs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-secondary)' }}>No blogs found. Create your first one.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {blogs.map(blog => (
              <div 
                key={blog.id} 
                onClick={() => openInspector(blog)}
                style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--admin-divider)', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--admin-glass-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 64, height: 48, borderRadius: 8, background: 'var(--admin-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginRight: 16 }}>
                  {blog.image_url ? <img src={blog.image_url} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon color="var(--admin-text-tertiary)" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--admin-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {blog.title}
                    {!blog.is_published && <span style={{fontSize: 10, padding: '2px 8px', background: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: 12, border: '1px solid rgba(245, 158, 11, 0.2)'}}>Draft</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--admin-text-secondary)', display: 'flex', gap: 12, marginTop: 4 }}>
                    <span>{blog.author}</span>
                    <span>•</span>
                    <span>{blog.category}</span>
                    <span>•</span>
                    <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedBlogId} onClose={() => setSelectedBlogId(null)} title="Edit Blog Post" width={700}>
        {selectedBlog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="admin-label">Title</label>
                <input className="admin-input" value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })} />
              </div>
              <div>
                <label className="admin-label">Slug</label>
                <input className="admin-input" value={editData.slug} onChange={e => setEditData({ ...editData, slug: e.target.value })} />
              </div>
              <div>
                <label className="admin-label">Category</label>
                <input className="admin-input" value={editData.category} onChange={e => setEditData({ ...editData, category: e.target.value })} />
              </div>
              <div>
                <label className="admin-label">Author</label>
                <input className="admin-input" value={editData.author} onChange={e => setEditData({ ...editData, author: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="admin-label">Excerpt</label>
              <textarea className="admin-input" value={editData.excerpt} onChange={e => setEditData({ ...editData, excerpt: e.target.value })} style={{ minHeight: 60 }} />
            </div>
            <div>
              <label className="admin-label">Content (Markdown)</label>
              <div style={{ background: '#fff', color: '#000', borderRadius: 8, overflow: 'hidden' }}>
                <SimpleMDE value={editData.content} onChange={val => setEditData({ ...editData, content: val })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ width: 100, height: 60, borderRadius: 8, overflow: 'hidden', background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                {selectedBlog.image_url ? <img src={selectedBlog.image_url} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
              </div>
              <div style={{ flex: 1 }}>
                <label className="admin-label">Replace Image</label>
                <input type="file" accept="image/*" onChange={e => setEditData({ ...editData, imageFile: e.target.files?.[0] || null })} style={{ display: 'block', width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 8, border: '1px dashed var(--admin-border)' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={editData.is_published} onChange={e => setEditData({ ...editData, is_published: e.target.checked })} />
                <span style={{ fontSize: 14, color: 'var(--admin-text-primary)' }}>Published (Visible on website)</span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, paddingTop: 24, borderTop: '1px solid var(--admin-divider)' }}>
              <button onClick={() => handleDelete(selectedBlog.id)} className="admin-btn" style={{ flex: 1, background: 'rgba(255,59,48,0.1)', color: '#ff3b30' }}>
                <Trash2 size={16} /> Delete
              </button>
              <button onClick={handleSaveEdit} disabled={saving} className="admin-btn admin-btn-primary" style={{ flex: 2 }}>
                {saving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Save Changes</>}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
