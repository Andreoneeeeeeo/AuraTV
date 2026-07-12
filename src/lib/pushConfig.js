// Chiave pubblica VAPID per le notifiche push — è sicura da avere nel
// codice client (è "pubblica" per definizione, come una chiave SSH
// pubblica). La chiave privata corrispondente resta solo lato server,
// come segreto della Edge Function "send-push".
export const VAPID_PUBLIC_KEY = 'BFMqc_S0-XkRVdWJZVI-SdN-xiNp4I5FmbRiKhUCA91dDrZsWQX6e5tghOXiNw_63MX3eXCpxHCEawoUITOE9ro';
