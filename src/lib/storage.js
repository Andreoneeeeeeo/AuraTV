import { supabase } from './supabaseClient.js';

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data || !data.user) throw new Error('Utente non autenticato');
  return data.user.id;
}

const storage = {
  async get(key) {
    const user_id = await currentUserId();
    const { data, error } = await supabase
      .from('app_data')
      .select('value')
      .eq('user_id', user_id)
      .eq('key', key)
      .maybeSingle();
    if (error || !data) throw new Error('Key not found: ' + key);
    return { key, value: data.value, shared: false };
  },

  async set(key, value) {
    const user_id = await currentUserId();
    const { error } = await supabase
      .from('app_data')
      .upsert({ user_id, key, value, updated_at: new Date().toISOString() }, { onConflict: 'user_id,key' });
    if (error) throw error;
    return { key, value, shared: false };
  },

  async delete(key) {
    const user_id = await currentUserId();
    const { error } = await supabase.from('app_data').delete().eq('user_id', user_id).eq('key', key);
    if (error) throw error;
    return { key, deleted: true, shared: false };
  },

  async list(prefix = '') {
    const user_id = await currentUserId();
    const { data, error } = await supabase
      .from('app_data')
      .select('key')
      .eq('user_id', user_id)
      .like('key', `${prefix}%`);
    if (error) throw error;
    return { keys: (data || []).map((r) => r.key), prefix, shared: false };
  },
};

window.storage = storage;
export default storage;
