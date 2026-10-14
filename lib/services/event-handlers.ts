import events, { EVENTS } from '@/lib/events';
import TelegramService from '@/lib/services/telegram';

/**
 * Event Handlers Initialization
 * Registers listeners for global events
 */

let initialized = false;

export function initEventHandlers() {
  if (initialized) return;
  
  console.log('[Events] Initializing notification handlers...');

  // 1. Listen for New Bookings
  events.on(EVENTS.BOOKING.CREATED, async ({ booking, customer }) => {
    try {
      console.log(`[Events] Handling ${EVENTS.BOOKING.CREATED} for #${booking.booking_number}`);
      
      // Send Telegram Notification
      const message = TelegramService.formatBookingMessage(booking, customer);
      const result = await TelegramService.sendMessage(message);
      
      if (result.success) {
        console.log(`[Events] Telegram notification sent for #${booking.booking_number}`);
      } else {
        console.warn(`[Events] Telegram notification failed: ${result.error}`);
      }
      
    } catch (error) {
      console.error('[Events] Error in booking.created handler:', error);
    }
  });

  // 2. Placeholder for other events (Email, SMS, etc.)
  events.on(EVENTS.BOOKING.CANCELLED, async ({ booking }) => {
    // Logic for cancellations
  });

  initialized = true;
}
