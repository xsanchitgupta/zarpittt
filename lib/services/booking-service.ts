import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import events, { EVENTS } from '@/lib/events';
import { AvailabilityService } from '@/lib/services/availability-service';
import { companionUnitPrice, clampPersons, COMPANION_HOURLY_INCREMENT } from '@/lib/companion';

/**
 * Booking Service
 * Handles all booking-related business logic and emits internal events
 */

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class BookingService {
  /**
   * Securely calculate pricing components from database lookup of cart items and coupons.
   */
  static async calculateSecurePrice(cart: any[], couponCode?: string): Promise<{
    subtotal: number;
    discount: number;
    total: number;
    bookingItems: {
      service_id: string;
      quantity: number;
      unit_price: number;
      service_name: string;
    }[];
  }> {
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return { subtotal: 0, discount: 0, total: 0, bookingItems: [] };
    }

    const serviceIds = [...new Set(cart.map((item: any) => item.id))];
    const { data: dbServices, error: dbSvcError } = await supabaseAdmin
      .from('services')
      .select('id, name, price, variants')
      .in('id', serviceIds);

    if (dbSvcError || !dbServices) {
      console.error('[BookingService] Secure pricing DB error:', dbSvcError);
      throw new Error(`Failed to retrieve services from database for secure pricing verification: ${dbSvcError?.message || 'No services returned'}`);
    }

    const serviceMap = new Map(dbServices.map((s: any) => [s.id, s]));
    let computedSubtotal = 0;
    const secureBookingItems: any[] = [];

    for (const item of cart) {
      const svc = serviceMap.get(item.id);
      if (!svc) {
        throw new Error(`Service with ID ${item.id} not found in database.`);
      }

      let itemPrice = svc.price || 0;
      let itemDisplayName = svc.name;

      if (item.variantName) {
        const variantsList = svc.variants || [];
        const matchedVariant = variantsList.find((v: any) => v.name === item.variantName);
        if (matchedVariant) {
          itemPrice = matchedVariant.price;
          itemDisplayName = `${svc.name} - ${item.variantName}`;
        }
      }

      // Companion / Helping Buddy booking options: base price covers the first
      // hour; each extra hour adds a flat ₹150 (COMPANION_HOURLY_INCREMENT),
      // then multiplied by the number of persons. Recomputed here server-side
      // so a tampered client cart can't lower the price.
      if (item.options) {
        const hours = Math.max(1, Math.min(12, Math.round(Number(item.options.hours)) || 1));
        const persons = clampPersons(Number(item.options.persons));
        itemPrice = companionUnitPrice(itemPrice, hours) * persons;
        const extraHours = Math.max(0, hours - 1);
        const extras = [
          `${hours} hr${hours > 1 ? 's' : ''}${extraHours > 0 ? ` (+₹${extraHours * COMPANION_HOURLY_INCREMENT})` : ''} × ${persons}`,
          item.options.genderPreference ? `${item.options.genderPreference} companion` : ''
        ].filter(Boolean).join(', ');
        itemDisplayName = `${itemDisplayName} (${extras})`;
      }

      const qty = item.quantity || 1;
      computedSubtotal += itemPrice * qty;

      // Build the booking items list
      for (let i = 0; i < qty; i++) {
        secureBookingItems.push({
          service_id: item.id,
          quantity: 1,
          unit_price: itemPrice,
          service_name: itemDisplayName
        });
      }
    }

    let computedDiscount = 0;
    if (couponCode) {
      const uppercaseCode = couponCode.toUpperCase();
      const { data: offer, error: offerError } = await supabaseAdmin
        .from('offers')
        .select('*')
        .eq('code', uppercaseCode)
        .eq('is_active', true)
        .maybeSingle();

      if (offer && !offerError) {
        const validTillDate = new Date(offer.valid_till);
        const isExpired = validTillDate < new Date();
        const limitReached = offer.usage_limit && offer.used_count >= offer.usage_limit;

        if (!isExpired && !limitReached) {
          if (offer.discount_type === 'percent') {
            computedDiscount = Math.floor((computedSubtotal * offer.discount_value) / 100);
            if (offer.max_discount) {
              computedDiscount = Math.min(computedDiscount, offer.max_discount);
            }
          } else {
            computedDiscount = offer.discount_value;
          }
        }
      }
    }

    const computedTotal = Math.max(0, computedSubtotal - computedDiscount);

    return {
      subtotal: computedSubtotal,
      discount: computedDiscount,
      total: computedTotal,
      bookingItems: secureBookingItems
    };
  }

  /**
   * Compute total estimated duration (in minutes) for a cart.
   * Uses variant_durations when available, falls back to duration_minutes.
   */
  static async computeEstimatedDuration(cart: any[]): Promise<number> {
    const serviceIds = [...new Set(cart.map((item: any) => item.id))];
    
    const { data: services } = await supabaseAdmin
      .from('services')
      .select('id, duration_minutes, variant_durations')
      .in('id', serviceIds);

    const serviceMap = new Map((services || []).map((s: any) => [s.id, s]));
    
    let totalMinutes = 0;
    for (const item of cart) {
      const svc = serviceMap.get(item.id);
      const qty = item.quantity || 1;

      // Companion bookings: duration comes from the chosen number of hours
      const optHours = item.options?.hours ? Math.max(1, Math.min(12, Math.round(Number(item.options.hours)) || 1)) : 0;
      if (optHours) {
        totalMinutes += optHours * 60 * qty;
        continue;
      }

      if (svc) {
        const vd = svc.variant_durations || {};
        // If this cart item has a variant, use variant-specific duration
        const variantDuration = item.variantName ? vd[item.variantName] : null;
        const baseDuration = variantDuration || svc.duration_minutes || 60;
        totalMinutes += baseDuration * qty;
      } else {
        totalMinutes += 60 * qty; // fallback 60 mins
      }
    }
    
    return totalMinutes;
  }

  /**
   * Create a new booking and trigger side effects
   */
  static async createBooking(payload: any) {
    const { 
      userId, 
      cart, 
      scheduledDate, 
      scheduledTime, 
      address, 
      instructions,
      selectedAddressId,
      newAddrLabel,
      newAddrText,
      userLat,
      userLng,
      paymentMethod = 'Pay After Service', // Default to Pay After Service
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature
    } = payload;

    try {
      // 0. Compute estimated duration from cart
      const estimatedDuration = await BookingService.computeEstimatedDuration(cart);
      console.log(`[BookingService] Estimated duration: ${estimatedDuration} mins for ${cart.length} items`);

      // 0.5 Real-time Availability Check
      if (scheduledTime !== 'Instant (Now)') {
        const isAvailable = await AvailabilityService.isSlotAvailable(scheduledDate, scheduledTime, estimatedDuration);
        if (!isAvailable) {
          throw new Error('The selected time slot is no longer available. Please choose another time.');
        }
      }

      // 0.7 Secure Server-Side Price Lookup and Recalculation
      const { 
        subtotal: computedSubtotal, 
        discount: computedDiscount, 
        total: computedTotal, 
        bookingItems: secureBookingItems 
      } = await BookingService.calculateSecurePrice(cart, payload.couponCode);

      const computedTax = 0; // 0% GST as requested

      console.log(`[BookingService] Secure recalculation result - Subtotal: ₹${computedSubtotal}, Discount: ₹${computedDiscount}, Total: ₹${computedTotal}`);

      // 1. Resolve Address
      let finalAddress = address;
      if (!selectedAddressId && newAddrText) {
        const dbAddress = address.includes(': ') ? address.split(': ')[1] : address;
        
        const { data: newAddr, error: addrError } = await supabaseAdmin.from('addresses').insert({
          user_id: userId,
          label: newAddrLabel || 'Home',
          full_address: dbAddress
        }).select().single();
        
        if (addrError) {
          console.warn(`[BookingService] Non-critical address save error: ${addrError.message}`);
        } else if (newAddr) {
          finalAddress = `${newAddr.label}: ${newAddr.full_address}`;
        }
      }

      // 2. Prepare Metadata
      const completionOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const bookingNumber = `ZRP-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      // Verify Razorpay Signature if payment method is Online
      if (paymentMethod === 'Online (Razorpay)' && razorpayPaymentId && razorpayOrderId && razorpaySignature) {
        const body = razorpayOrderId + '|' + razorpayPaymentId;
        const expectedSignature = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
          .update(body.toString())
          .digest('hex');

        if (expectedSignature !== razorpaySignature) {
          throw new Error('Invalid payment signature');
        }

        // Fetch official order from Razorpay to verify exact amount captured
        const razorpay = new Razorpay({
          key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
          key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const order = await razorpay.orders.fetch(razorpayOrderId);
        if (!order) {
          throw new Error('Razorpay order verification failed: Order not found');
        }

        // Check if amount paid/captured matches computedTotal
        if (Number(order.amount) !== Math.round(computedTotal * 100)) {
          console.error(`[BookingService] Razorpay payment amount mismatch! Recalculated: ₹${computedTotal} (${Math.round(computedTotal * 100)} paise), Razorpay order amount: ${order.amount} paise.`);
          throw new Error('Payment verification failed: Captured amount does not match booking rate');
        }
      }

      // 3. Database Transaction (Manual flow for Supabase)
      // A. Create Booking (with estimated_duration_minutes)
      const { data: booking, error: bookingError } = await supabaseAdmin
        .from('bookings')
        .insert({
          user_id: userId,
          booking_number: bookingNumber, 
          status: 'pending',
          subtotal: computedSubtotal,
          tax: computedTax,
          discount: computedDiscount,
          total: computedTotal,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          address: finalAddress,
          payment_method: paymentMethod,
          special_instructions: instructions || null,
          completion_otp: completionOtp,
          estimated_duration_minutes: estimatedDuration,
          coupon_code: payload.couponCode || null,
        })
        .select()
        .single();

      if (bookingError) throw new Error(bookingError.message);

      // B. Create Items
      const bookingItems = secureBookingItems.map((item: any) => ({
        booking_id: booking.id,
        service_id: item.service_id,
        quantity: 1,
        unit_price: item.unit_price,
        service_name: item.service_name,
      }));

      const { error: itemsError } = await supabaseAdmin.from('booking_items').insert(bookingItems);
      if (itemsError) console.error('[BookingService] Items insert error:', itemsError);

      // C. Create Payment Record
      await supabaseAdmin.from('payments').insert({
        booking_id: booking.id,
        amount: computedTotal,
        method: paymentMethod,
        status: paymentMethod === 'Online (Razorpay)' ? 'completed' : 'pending',
        transaction_id: razorpayPaymentId || null,
      });

      // D. Initial Status Log
      await supabaseAdmin.from('booking_status_log').insert({
        booking_id: booking.id,
        new_status: 'scheduled',
        changed_by: userId,
        notes: 'Order placed via BookingService',
      });

      // E. Increment Coupon usage count if couponCode is provided
      if (payload.couponCode) {
        const { data: offerData } = await supabaseAdmin
          .from('offers')
          .select('id, used_count')
          .eq('code', payload.couponCode.toUpperCase())
          .maybeSingle();

        if (offerData) {
          await supabaseAdmin
            .from('offers')
            .update({ used_count: (offerData.used_count || 0) + 1 })
            .eq('id', offerData.id);
        }
      }

      // 4. Fetch Customer Profile for Notification
      const { data: customer } = await supabaseAdmin
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', userId)
        .single();

      // 5. Emit Event (Decoupled Side Effects)
      console.log(`[BookingService] Emitting ${EVENTS.BOOKING.CREATED} for #${booking.booking_number}`);
      events.emit(EVENTS.BOOKING.CREATED, { booking, customer });

      return { success: true, bookingId: booking.id, bookingNumber };

    } catch (error: any) {
      console.error('[BookingService] Creation failed:', error.message);
      throw error;
    }
  }
}

export default BookingService;
