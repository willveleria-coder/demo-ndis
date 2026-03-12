import { supabase } from '../lib/supabase';

export async function getShifts() {
  const { data, error } = await supabase
    .from('shifts')
    .select('*, staff(id, first_name, last_name), participants(id, first_name, last_name)')
    .order('shift_date', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getShift(id) {
  const { data, error } = await supabase
    .from('shifts')
    .select('*, staff(*, documents(*)), participants(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createShift(shift) {
  const { data, error } = await supabase
    .from('shifts')
    .insert(shift)
    .select('*, staff(id, first_name, last_name), participants(id, first_name, last_name)')
    .single();
  if (error) throw error;
  return data;
}

export async function updateShift(id, updates) {
  const { data, error } = await supabase
    .from('shifts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteShift(id) {
  const { error } = await supabase
    .from('shifts')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function clockIn(id) {
  const { data, error } = await supabase
    .from('shifts')
    .update({ clock_in: new Date().toISOString(), status: 'in_progress' })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function clockOut(id) {
  const { data, error } = await supabase
    .from('shifts')
    .update({ clock_out: new Date().toISOString(), status: 'completed' })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}