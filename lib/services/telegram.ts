/**
 * Telegram Notification Service
 * Handles sending formatted messages to admin via Telegram Bot API
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

export interface TelegramMessageOptions {
  parse_mode?: 'HTML' | 'MarkdownV2';
  disable_notification?: boolean;
}

export class TelegramService {
  /**
   * Send a message to the admin chat
   */
  static async sendMessage(text: string, options: TelegramMessageOptions = { parse_mode: 'HTML' }) {
    if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
      console.warn('[TelegramService] Missing credentials. Message not sent.', { BOT_TOKEN: !!BOT_TOKEN, ADMIN_CHAT_ID: !!ADMIN_CHAT_ID });
      return { success: false, error: 'Missing credentials' };
    }

    console.log(`[TelegramService] Attempting to send message to ${ADMIN_CHAT_ID}...`);

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text,
          ...options
        }),
      });

      const data = await response.json();
      
      if (!data.ok) {
        console.error('[TelegramService] Telegram API Error:', data);
        throw new Error(data.description || 'Failed to send Telegram message');
      }

      console.log('[TelegramService] Success: Message delivered to Telegram.');
      return { success: true, data };
    } catch (error: any) {
      console.error('[TelegramService] Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Format a booking notification message
   */
  static formatBookingMessage(booking: any, customer: any) {
    const date = new Date(booking.scheduled_date).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short'
    });

    return `
✨ <b>NEW BOOKING RECEIVED</b> ✨
───────────────────────
🆔 <b>Order:</b> #${booking.booking_number}
👤 <b>Customer:</b> ${customer.full_name}
📞 <b>Phone:</b> <code>${customer.phone || 'N/A'}</code>
📧 <b>Email:</b> ${customer.email}

📅 <b>Schedule:</b> ${date} at ${booking.scheduled_time}
📍 <b>Address:</b> ${booking.address}

💰 <b>Total Amount:</b> ₹${booking.total}
💳 <b>Payment:</b> ${booking.payment_method}
📝 <b>Notes:</b> ${booking.special_instructions || 'None'}

───────────────────────
⚡️ <i>Action required: Open Admin Panel to assign a professional.</i>
    `.trim();
  }
}

export default TelegramService;
