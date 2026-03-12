import { supabase } from '../lib/supabase';

export async function getIncidents() {
  const { data, error } = await supabase
    .from('incidents')
    .select('*, participants(id, first_name, last_name), staff:reported_by(id, first_name, last_name)')
    .order('incident_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getIncident(id) {
  const { data, error } = await supabase
    .from('incidents')
    .select('*, participants(*), staff:reported_by(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createIncident(incident) {
  const { data, error } = await supabase
    .from('incidents')
    .insert(incident)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateIncident(id, updates) {
  const { data, error } = await supabase
    .from('incidents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteIncident(id) {
  const { error } = await supabase
    .from('incidents')
    .delete()
    .eq('id', id);
  if (error) throw error;
}