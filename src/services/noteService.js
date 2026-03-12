import { supabase } from '../lib/supabase';

export async function getNotes() {
  const { data, error } = await supabase
    .from('shift_notes')
    .select('*, shifts(*, staff(id, first_name, last_name), participants(id, first_name, last_name))')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getNote(id) {
  const { data, error } = await supabase
    .from('shift_notes')
    .select('*, shifts(*, staff(*), participants(*))')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createNote(note) {
  const { data, error } = await supabase
    .from('shift_notes')
    .insert(note)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateNote(id, updates) {
  const { data, error } = await supabase
    .from('shift_notes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getNotesByShift(shiftId) {
  const { data, error } = await supabase
    .from('shift_notes')
    .select('*')
    .eq('shift_id', shiftId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}