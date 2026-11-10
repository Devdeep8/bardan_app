// src/services/mandi/notification.service.js
// Outbound farmer/driver messages. Console provider for the MVP (free);
// swap `sendViaChannel` for WhatsApp Cloud API / SMS gateway later.
import { Logger } from '@src/utils/logger.js';

async function sendViaChannel(phone, message) {
  // TODO(pilot): replace with a real WhatsApp/SMS provider
  Logger.info(`[Notify] +91${phone}: ${message}`);
}

export const NotificationService = {
  /** Fire-and-forget notification (log failures, never throw). */
  async notify(phone, message) {
    try {
      await sendViaChannel(phone, message);
    } catch (error) {
      Logger.error(`Notification failed for +91${phone}`, { error: error.message });
    }
  }
};
