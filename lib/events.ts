import { EventEmitter } from 'events';

/**
 * Global Event Emitter for Backend Services
 * Used to decouple core logic from side effects (notifications, etc.)
 */
class GlobalEventEmitter extends EventEmitter {}

// Singleton instance
const events = new GlobalEventEmitter();

// Event Name Constants
export const EVENTS = {
  BOOKING: {
    CREATED: 'booking.created',
    UPDATED: 'booking.updated',
    CANCELLED: 'booking.cancelled',
  },
  NOTIFICATION: {
    SENT: 'notification.sent',
    FAILED: 'notification.failed',
  }
};

export default events;
