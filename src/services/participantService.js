import { supabase } from '../lib/supabase';

export async function getParticipants() {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getParticipant(id) {
  const { data, error } = await supabase
    .from('participants')
    .select('*, participant_staff(*, staff(*)), goals(*), progress_notes(*, staff(first_name, last_name)), documents(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createParticipant(participant) {
  const { data, error } = await supabase
    .from('participants')
    .insert(participant)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateParticipant(id, updates) {
  const { data, error } = await supabase
    .from('participants')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteParticipant(id) {
  const { error } = await supabase
    .from('participants')
    .delete()
    .eq('id', id);
  if (error) throw error;
}