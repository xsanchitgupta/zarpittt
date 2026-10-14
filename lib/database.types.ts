/* =============================================
   Zarpit Database Types
   Matches the Supabase schema exactly
   ============================================= */

export type UserRole = 'user' | 'admin' | 'professional';
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type DiscountType = 'percent' | 'flat';
export type NotificationType = 'booking' | 'promo' | 'system' | 'payment';

export interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  is_coming_soon?: boolean;
  parent_id?: string | null;
  created_at: string;
  is_independent_service?: boolean;
  service_id?: number;
}

export interface Service {
  id: number;
  name: string;
  category_id: string;
  price: number;
  original_price: number;
  discount: number;
  rating: number;
  reviews: number;
  duration: string;
  image: string;
  badge: string | null;
  description: string;
  included: string[];
  not_included?: string[];
  dos_and_donts?: { dos: string[]; donts: string[] };
  variants?: { name: string; price: number }[];
  slug: string;
  is_active: boolean;
  is_coming_soon?: boolean;
  is_independent?: boolean;
  sort_order: number;
  buffer_time: number;
  duration_minutes: number;
  variant_durations: Record<string, number>;
  gallery_images?: string[];
  video_url?: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  category?: Category;
}

export interface Professional {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  jobs_count: number;
  experience: string;
  avatar: string;
  tags: string[];
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  booking_number: string;
  status: BookingStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  scheduled_date: string;
  scheduled_time: string;
  address: string;
  payment_method: string;
  special_instructions: string | null;
  professional_id: number | null;
  coupon_code: string | null;
  completion_otp: string | null;
  cancellation_reason: string | null;
  estimated_duration_minutes: number;
  group_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  booking_items?: BookingItem[];
  professional?: Professional;
  profile?: Profile;
}

export interface BookingItem {
  id: string;
  booking_id: string;
  service_id: number;
  quantity: number;
  unit_price: number;
  service_name: string;
  created_at: string;
  // Joined
  service?: Service;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  full_address: string;
  house_no?: string;
  building_name?: string;
  landmark?: string;
  city: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at: string;
}

export interface Offer {
  id: number;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  max_discount: number | null;
  title: string;
  description: string;
  valid_from: string;
  valid_till: string;
  is_active: boolean;
  usage_limit: number | null;
  used_count: number;
  created_at: string;
}

export interface Testimonial {
  id: number;
  user_name: string;
  location: string;
  avatar: string;
  rating: number;
  text: string;
  service_name: string;
  is_featured: boolean;
  is_approved: boolean;
  service_id?: number | null;
  created_at: string;
}

export interface ServiceArea {
  id: number;
  name: string;
  city: string;
  is_active: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface BookingStatusLog {
  id: string;
  booking_id: string;
  old_status: BookingStatus | null;
  new_status: BookingStatus;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  transaction_id: string | null;
  created_at: string;
}

export interface CartItemDB {
  id: string;
  user_id: string;
  service_id: number;
  quantity: number;
  variant_name?: string;
  created_at: string;
  // Joined
  service?: Service;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  label: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ProviderProfile {
  id: string;
  user_id: string;
  verification_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  worker_type: 'commission' | 'salaried';
  salary_amount: number;
  added_by_admin: string | null;
  experience_years: number;
  services_offered: string[];
  aadhaar_number: string | null;
  aadhaar_image: string | null;
  selfie_image: string | null;
  pan_number: string | null;
  pan_card_image: string | null;
  driving_license: string | null;
  account_name: string | null;
  account_number: string | null;
  bank_name: string | null;
  ifsc_code: string | null;
  has_vehicle: boolean;
  vehicle_type: string | null;
  vehicle_number: string | null;
  current_lat: number | null;
  current_lng: number | null;
  is_online: boolean;
  last_location_update: string | null;
  schedule_slots: ScheduleSlot[];
  max_distance_km: number;
  bio: string | null;
  availability_slots: AvailabilitySlots | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleSlot {
  day: string;
  times: string[];
}

export interface AvailabilitySlots {
  days: string[];
  times: string[];
}
