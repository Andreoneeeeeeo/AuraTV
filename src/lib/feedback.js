import { supabase } from './supabaseClient.js';

export async function sendFeedback(message, username, userEmail) {
  const { data, error } = await supabase.functions.invoke('send-feedback', {
    body: { message, username, userEmail },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}
