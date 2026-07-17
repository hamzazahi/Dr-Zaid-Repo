import { supabase, isSupabaseConfigured } from '../lib/supabase';

// File storage (Supabase Storage). Buckets are private; reads go through
// short-lived signed URLs so RLS-style bucket policies stay authoritative.

const sanitize = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

export const storageService = {
  isLive: () => isSupabaseConfigured,

  // Returns the storage path to persist on the entity row.
  async upload(bucket, patientId, file) {
    const path = `${patientId}/${Date.now()}-${sanitize(file.name)}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });
    if (error) throw error;
    return path;
  },

  // Signed URL valid for one hour — enough for viewing/downloading.
  async signedUrl(bucket, path) {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
    if (error) throw error;
    return data.signedUrl;
  },

  async remove(bucket, path) {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  },
};
