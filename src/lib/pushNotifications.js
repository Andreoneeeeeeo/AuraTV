import { supabase } from './supabaseClient.js';
import { VAPID_PUBLIC_KEY } from './pushConfig.js';

export function isPushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function getPushPermissionState() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

// Attiva le notifiche: registra il Service Worker, chiede il permesso,
// crea l'iscrizione push e la salva sul tuo account.
export async function enablePushNotifications(userId) {
  if (!isPushSupported()) throw new Error('unsupported');

  const registration = await navigator.serviceWorker.register('./sw-push.js');
  await navigator.serviceWorker.ready;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('denied');

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = subscription.toJSON();
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  }, { onConflict: 'endpoint' });
  if (error) throw error;

  return subscription;
}

// Disattiva le notifiche su questo dispositivo (le preferenze restano,
// solo l'iscrizione a QUESTO dispositivo viene rimossa).
export async function disablePushNotifications() {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration('./sw-push.js');
  if (!registration) return;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe().catch(() => {});
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint).catch(() => {});
  }
}
