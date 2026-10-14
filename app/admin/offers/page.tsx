'use client';
import { useState, useEffect } from 'react';
import { adminFetch } from '@/lib/admin-fetch';
import type { Offer } from '@/lib/database.types';
import { Plus, Tag, Trash2, Link, Save, Ticket, Edit } from 'lucide-react';
import { toast } from '@/components/Toast';

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState<number | ''>('');
  const [usageLimit, setUsageLimit] = useState<number | ''>('');
  const [validTill, setValidTill] = useState('');
  const [editingOfferId, setEditingOfferId] = useState<number | null>(null);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/offers');
      if (res.ok) {
        const data = await res.json();
        if (data) setOffers(data as Offer[]);
      }
    } catch (err) { console.error('Offers fetch error:', err); }
    setLoading(false);
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleCreate = async () => {
    if (!code || !discountValue || !validTill) {
      toast.error('Required Fields', 'Please fill the Coupon Code, Discount amount, and Expiry Date.');
      return;
    }
    
    const couponData = {
      code: code.toUpperCase(),
      description,
      discount_type: discountType,
      discount_value: discountValue,
      max_discount: maxDiscount || null,
      usage_limit: usageLimit || null,
      valid_till: new Date(validTill).toISOString(),
    };

    if (editingOfferId) {
      const res = await adminFetch('/api/admin/offers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingOfferId, ...couponData })
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error('Failed', err.error || 'Update failed');
        return;
      }
      toast.success('Success', `Coupon ${code.toUpperCase()} updated successfully!`);
    } else {
      const res = await adminFetch('/api/admin/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponData)
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error('Failed', err.error || 'Creation failed');
        return;
      }
      toast.success('Success', `Coupon ${code.toUpperCase()} created successfully!`);
    }

    setShowAdd(false);
    setEditingOfferId(null);
    setCode('');
    setDescription('');
    setDiscountValue(0);
    setMaxDiscount('');
    setUsageLimit('');
    setValidTill('');
    fetchOffers();
  };

  const startEdit = (offer: Offer) => {
    setEditingOfferId(offer.id);
    setCode(offer.code);
    setDescription(offer.description || '');
    setDiscountType(offer.discount_type as any);
    setDiscountValue(offer.discount_value);
    setMaxDiscount(offer.max_discount || '');
    setUsageLimit(offer.usage_limit || '');
    setValidTill(offer.valid_till ? new Date(offer.valid_till).toISOString().split('T')[0] : '');
    setShowAdd(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    await adminFetch(`/api/admin/offers?id=${id}`, { method: 'DELETE' });
    toast.success('Deleted', 'Coupon removed from the system.');
    fetchOffers();
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:32}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h1 style={{fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif',fontSize:'2rem',fontWeight:700,color:'var(--admin-text-primary)'}}>Coupons & Offers</h1>
          <p style={{color:'var(--admin-text-secondary)',fontSize:'1rem',marginTop:4}}>Manage your discount codes</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => {
          if (showAdd) {
            setEditingOfferId(null);
            setCode('');
            setDescription('');
            setDiscountValue(0);
            setMaxDiscount('');
            setUsageLimit('');
            setValidTill('');
          }
          setShowAdd(!showAdd);
        }}>
          <Plus size={18} /> {showAdd ? 'Cancel' : 'New Coupon'}
        </button>
      </div>

      {showAdd && (
        <div style={{padding:32,background:'var(--admin-surface)',borderRadius:16,border:'1px solid var(--admin-border)'}}>
          <h2 style={{fontSize:'1.2rem',fontWeight:600,marginBottom:24,color:'var(--admin-text-primary)'}}>
            {editingOfferId ? 'Edit Coupon' : 'Create New Coupon'}
          </h2>
          
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
            <div>
              <label style={{display:'block',fontSize:13,fontWeight:500,color:'var(--admin-text-secondary)',marginBottom:8}}>Coupon Code</label>
              <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} className="admin-input" placeholder="e.g. WELCOME50" style={{textTransform:'uppercase'}} />
            </div>
            <div>
              <label style={{display:'block',fontSize:13,fontWeight:500,color:'var(--admin-text-secondary)',marginBottom:8}}>Expiry Date</label>
              <input type="date" value={validTill} onChange={e=>setValidTill(e.target.value)} className="admin-input" />
            </div>

            <div>
              <label style={{display:'block',fontSize:13,fontWeight:500,color:'var(--admin-text-secondary)',marginBottom:8}}>Discount Type</label>
              <select value={discountType} onChange={e=>setDiscountType(e.target.value as any)} className="admin-input">
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label style={{display:'block',fontSize:13,fontWeight:500,color:'var(--admin-text-secondary)',marginBottom:8}}>Disconnect Value</label>
              <input type="number" value={discountValue} onChange={e=>setDiscountValue(Number(e.target.value))} className="admin-input" placeholder="e.g. 50" />
            </div>

            {discountType === 'percent' && (
              <div>
                <label style={{display:'block',fontSize:13,fontWeight:500,color:'var(--admin-text-secondary)',marginBottom:8}}>Max Discount Cap (Optional)</label>
                <input type="number" value={maxDiscount} onChange={e=>setMaxDiscount(Number(e.target.value))} className="admin-input" placeholder="e.g. 200" />
              </div>
            )}

            <div>
              <label style={{display:'block',fontSize:13,fontWeight:500,color:'var(--admin-text-secondary)',marginBottom:8}}>Total Usage Limit (Optional)</label>
              <input type="number" value={usageLimit} onChange={e=>setUsageLimit(Number(e.target.value))} className="admin-input" placeholder="e.g. 100 uses total" />
            </div>
          </div>

          <div style={{marginTop:24}}>
            <label style={{display:'block',fontSize:13,fontWeight:500,color:'var(--admin-text-secondary)',marginBottom:8}}>Description</label>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} className="admin-input" rows={2} placeholder="Optional friendly description" />
          </div>

          <div style={{marginTop:24,display:'flex',justifyContent:'flex-end'}}>
            <button className="admin-btn admin-btn-primary" onClick={handleCreate}><Save size={18} /> Save Coupon</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{textAlign:'center',padding:40,color:'var(--admin-text-tertiary)'}}>Loading offers...</div>
      ) : offers.length === 0 ? (
        <div style={{textAlign:'center',padding:64,background:'var(--admin-surface)',borderRadius:16,border:'1px solid var(--admin-border)'}}>
          <div style={{width:64,height:64,borderRadius:'50%',background:'var(--admin-glass-hover)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',color:'var(--admin-text-tertiary)'}}>
            <Ticket size={32} />
          </div>
          <h3 style={{fontSize:'1.2rem',fontWeight:600,color:'var(--admin-text-primary)',marginBottom:8}}>No Coupons Active</h3>
          <p style={{color:'var(--admin-text-secondary)'}}>Create a discount code to start driving sales.</p>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))',gap:24}}>
          {offers.map(offer => {
            const isExpired = new Date(offer.valid_till) < new Date();
            const isActive = offer.is_active && !isExpired;
            
            return (
              <div key={offer.id} style={{
                background:'var(--admin-surface)',padding:24,borderRadius:16,border:'1px solid var(--admin-border)',
                display:'flex',flexDirection:'column',gap:16, position:'relative', overflow: 'hidden'
              }}>
                <div style={{position:'absolute',top:24,right:56,cursor:'pointer',color:'var(--admin-text-secondary)'}} onClick={() => startEdit(offer)}>
                  <Edit size={18} />
                </div>
                <div style={{position:'absolute',top:24,right:24,cursor:'pointer',color:'var(--error)'}} onClick={() => handleDelete(offer.id)}>
                  <Trash2 size={18} />
                </div>
                <div>
                  <span style={{
                    display:'inline-block',background: isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: isActive ? '#22c55e' : '#ef4444', padding:'4px 10px', borderRadius:20, fontSize:12, fontWeight:600,
                    marginBottom:12
                  }}>
                    {isActive ? 'ACTIVE' : 'EXPIRED'}
                  </span>
                  <h3 style={{fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif',fontSize:'1.4rem',fontWeight:700,color:'var(--admin-text-primary)'}}>{offer.code}</h3>
                  <p style={{color:'var(--admin-text-secondary)',fontSize:14,marginTop:4}}>{offer.description || 'No description'}</p>
                </div>
                
                <div style={{background:'var(--admin-glass-hover)',padding:16,borderRadius:12,display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                    <span style={{color:'var(--admin-text-tertiary)'}}>Discount</span>
                    <span style={{color:'var(--admin-text-primary)',fontWeight:600}}>
                      {offer.discount_type === 'percent' ? `${offer.discount_value}% OFF` : `₹${offer.discount_value} FLAT`}
                    </span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                    <span style={{color:'var(--admin-text-tertiary)'}}>Usage</span>
                    <span style={{color:'var(--admin-text-primary)',fontWeight:600}}>
                      {offer.used_count} {offer.usage_limit ? `/ ${offer.usage_limit}` : 'uses'}
                    </span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                    <span style={{color:'var(--admin-text-tertiary)'}}>Expires on</span>
                    <span style={{color:'var(--admin-text-primary)',fontWeight:600}}>
                      {new Date(offer.valid_till).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
