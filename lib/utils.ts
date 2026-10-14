'use client';

import supabase from '@/lib/supabase';
import type { Service } from '@/lib/database.types';
import { optionsSignature, type BookingOptions } from '@/lib/companion';

export function formatPrice(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

export function getStars(rating: number): string {
  return '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '★' : '');
}

// ============================================
// Cart — Hybrid: Supabase for logged-in, localStorage for anonymous
// ============================================
const CART_KEY = 'zarpit_cart';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  duration: string;
  category: string;
  image: string;
  quantity: number;
  variantName?: string;
  /** Companion / Helping Buddy booking options (hours, persons, gender preference, meet point, need) */
  options?: BookingOptions;
}

/** Two cart lines are the same only if id, variant AND booking options all match */
function isSameLine(item: CartItem, id: number, variantName?: string, options?: BookingOptions): boolean {
  return item.id === id
    && (item.variantName || '') === (variantName || '')
    && optionsSignature(item.options) === optionsSignature(options);
}

// ----- LOCAL CART (anonymous users) -----
export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch { return []; }
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('cartUpdate'));
}

export function addToCart(service: { id: number; name: string; price: number; originalPrice: number; duration: string; category: string; image?: string; variantName?: string; options?: BookingOptions }) {
  const cart = getCart();
  // Check if already in cart (same id + variant + options)
  const existingIdx = cart.findIndex(i => isSameLine(i, service.id, service.variantName, service.options));
  if (existingIdx >= 0) {
    // Increment quantity (max 5 per item)
    if (cart[existingIdx].quantity < 5) {
      cart[existingIdx].quantity += 1;
      saveCart(cart);
    }
    return false; // False indicates it was an update/increment
  }
  // Max 10 unique items
  if (cart.length >= 10) return false;
  cart.push({ ...service, image: service.image || '', quantity: 1 });
  saveCart(cart);
  return true; // True indicates it was a new addition
}

export function removeFromCart(id: number, variantName?: string, options?: BookingOptions) {
  saveCart(getCart().filter(i => !isSameLine(i, id, variantName, options)));
}

export function updateQuantity(id: number, variantName: string | undefined, qty: number, options?: BookingOptions) {
  if (qty <= 0) return removeFromCart(id, variantName, options);
  const cart = getCart();
  const item = cart.find(i => isSameLine(i, id, variantName, options));
  if (item) { item.quantity = qty; saveCart(cart); }
}

export function getCartCount(): number {
  return getCart().reduce((s, i) => s + i.quantity, 0);
}

export function getCartTotal(): number {
  return getCart().reduce((s, i) => s + i.price * i.quantity, 0);
}

export function getCartSavings(): number {
  return getCart().reduce((s, i) => s + (i.originalPrice - i.price) * i.quantity, 0);
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event('cartUpdate'));
}

// ----- SUPABASE CART (logged-in users) -----
export async function addToCartDB(userId: string, service: Service, variantName?: string, price?: number) {
  // Check if already in cart
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', userId)
    .eq('service_id', service.id)
    .eq('variant_name', variantName || '');

  if (existing && existing.length > 0) {
    // Increment quantity (max 5)
    const current = existing[0];
    if ((current.quantity || 1) < 5) {
      await supabase
        .from('cart_items')
        .update({ quantity: (current.quantity || 1) + 1 })
        .eq('id', current.id);
    }
    window.dispatchEvent(new Event('cartUpdate'));
    return;
  }

  // Check max 10
  const { count } = await supabase
    .from('cart_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if ((count || 0) >= 10) {
    window.dispatchEvent(new Event('cartUpdate'));
    return;
  }

  await supabase
    .from('cart_items')
    .insert({ user_id: userId, service_id: service.id, quantity: 1, variant_name: variantName || '' });
    
  window.dispatchEvent(new Event('cartUpdate'));
}

export async function removeFromCartDB(userId: string, serviceId: number, variantName: string = '') {
  await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('service_id', serviceId)
    .eq('variant_name', variantName);
  window.dispatchEvent(new Event('cartUpdate'));
}

export async function updateCartQuantityDB(userId: string, serviceId: number, qty: number, variantName: string = '') {
  if (qty <= 0) return removeFromCartDB(userId, serviceId, variantName);
  await supabase
    .from('cart_items')
    .update({ quantity: qty })
    .eq('user_id', userId)
    .eq('service_id', serviceId)
    .eq('variant_name', variantName);
  window.dispatchEvent(new Event('cartUpdate'));
}

export async function clearCartDB(userId: string) {
  await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId);
  window.dispatchEvent(new Event('cartUpdate'));
}

export async function getCartDB(userId: string) {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*, service:services(*, category:categories(*))')
    .eq('user_id', userId);
  if (error) return [];
  return data;
}

export async function syncLocalCartToDB(userId: string) {
  const localCart = getCart();
  if (localCart.length === 0) return;

  // Sync all local items to DB (upsert to avoid duplicates)
  for (const item of localCart) {
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id')
      .eq('user_id', userId)
      .eq('service_id', item.id)
      .eq('variant_name', item.variantName || '');

    if (!existing || existing.length === 0) {
      await supabase
        .from('cart_items')
        .insert({ user_id: userId, service_id: item.id, quantity: item.quantity, variant_name: item.variantName || '' });
    }
  }

  clearCart(); // Clear localStorage after sync
}

// ----- COUPON VALIDATION -----
export async function applyCouponDB(code: string, total: number) {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .gte('valid_till', new Date().toISOString())
    .single();

  if (error || !data) return null;

  if (data.usage_limit && data.used_count >= data.usage_limit) return null;

  let discount: number;
  if (data.discount_type === 'percent') {
    discount = Math.floor(total * data.discount_value / 100);
    if (data.max_discount) discount = Math.min(discount, data.max_discount);
  } else {
    discount = data.discount_value;
  }

  return { ...data, discount };
}

// Keep old applyCoupon for backward compat (offline fallback)
export function applyCoupon(code: string) {
  const coupons: Record<string, { type: string; value: number; maxDiscount?: number }> = {
    'ZARPIT50': { type: 'percent', value: 50, maxDiscount: 500 },
    'CLEAN300': { type: 'flat', value: 300 },
    'CARE40': { type: 'percent', value: 40, maxDiscount: 400 },
    'REFER500': { type: 'flat', value: 500 },
  };
  const coupon = coupons[code.toUpperCase()];
  if (!coupon) return null;
  const total = getCartTotal();
  let discount = coupon.type === 'percent'
    ? Math.min(Math.floor(total * coupon.value / 100), coupon.maxDiscount || Infinity)
    : coupon.value;
  return { ...coupon, code: code.toUpperCase(), discount };
}

// ----- UI HELPERS -----
export function formatServiceNames(items: any[]): string {
  if (!items || items.length === 0) return 'Service';
  const counts: Record<string, number> = {};
  items.forEach(i => {
    const name = i.service_name || 'Service';
    counts[name] = (counts[name] || 0) + 1;
  });
  return Object.entries(counts).map(([name, count]) => count > 1 ? `${name} (x${count})` : name).join(', ');
}

export function parseAddress(addrObj: any) {
  if (!addrObj || !addrObj.full_address) return addrObj;
  
  // Check for enrichment marker [D:{...}]
  if (addrObj.full_address.startsWith('[D:')) {
    try {
      const endMarker = addrObj.full_address.indexOf(']');
      if (endMarker > 3) {
        const jsonStr = addrObj.full_address.substring(3, endMarker);
        const details = JSON.parse(jsonStr);
        const cleanAddress = addrObj.full_address.substring(endMarker + 1).trim();
        
        return {
          ...addrObj,
          ...details,
          full_address: cleanAddress
        };
      }
    } catch (e) {
      console.error('Failed to parse enriched address:', e);
    }
  }
  
  return addrObj;
}
