import supabase from '@/lib/supabase';
import type { NotificationType } from '@/lib/database.types';

export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = 'system',
  metadata?: Record<string, unknown>
) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    metadata: metadata || null,
  });
  if (error) console.error('Notification send error:', error);
  return !error;
}

export async function markAsRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  return !error;
}

export async function markAllAsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  return !error;
}
