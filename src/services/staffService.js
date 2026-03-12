import { supabase } from '../lib/supabase';

export async function getStaffMembers() {
  const { data, error } = await supabase
    .from('staff')
    .select('*, documents(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getStaffMember(id) {
  const { data, error } = await supabase
    .from('staff')
    .select('*, documents(*), shifts(*), participant_staff(*, participants(*))')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateStaffMember(id, updates) {
  const { data, error } = await supabase
    .from('staff')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteStaffMember(id) {
  const { error } = await supabase
    .from('staff')
    .delete()
    .eq('id', id);
  if (error) throw error;
}