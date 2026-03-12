import { supabase } from '../lib/supabase';

export async function getDocuments({ staffId, participantId } = {}) {
  let query = supabase
    .from('documents')
    .select('*, staff(id, first_name, last_name), participants(id, first_name, last_name)')
    .order('uploaded_at', { ascending: false });

  if (staffId) query = query.eq('staff_id', staffId);
  if (participantId) query = query.eq('participant_id', participantId);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createDocument(doc) {
  const { data, error } = await supabase
    .from('documents')
    .insert(doc)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDocument(id, updates) {
  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDocument(id) {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function uploadFile(file, path) {
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(path, file);
  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(path);

  return urlData.publicUrl;
}

export async function getExpiringDocuments(daysAhead = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const { data, error } = await supabase
    .from('documents')
    .select('*, staff(id, first_name, last_name)')
    .lte('expiry_date', futureDate.toISOString().split('T')[0])
    .gte('expiry_date', new Date().toISOString().split('T')[0])
    .order('expiry_date', { ascending: true });
  if (error) throw error;
  return data;
}