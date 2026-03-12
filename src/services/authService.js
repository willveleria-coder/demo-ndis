import { supabase } from '../lib/supabase';

// ============================================
// ADMIN AUTH
// ============================================

// Admin signs up (first time org setup)
export async function adminSignUp({ email, password, firstName, lastName, orgName }) {
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (authError) throw authError;

  // 2. Create org + admin via server function (bypasses RLS)
  const { data, error } = await supabase.rpc('create_org_and_admin', {
    p_org_name: orgName,
    p_auth_id: authData.user.id,
    p_first_name: firstName,
    p_last_name: lastName,
    p_email: email,
  });
  if (error) throw error;

  return { user: authData.user, orgId: data.org_id, staffId: data.staff_id };
}

// Admin logs in
export async function adminLogin({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  // Get staff record with org
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('*')
    .eq('auth_id', data.user.id)
    .single();
  if (staffError) throw staffError;

  if (staff.role !== 'admin') {
    throw new Error('Not an admin account. Please use staff login.');
  }

  return { user: data.user, session: data.session, staff };
}

// ============================================
// STAFF INVITE SYSTEM
// ============================================

// Admin generates invite code for new staff
export async function createStaffInvite({ orgId, firstName, lastName, email, phone, position, employmentType }) {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48);

  const { data, error } = await supabase
    .from('staff')
    .insert({
      org_id: orgId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      position,
      employment_type: employmentType,
      role: 'staff',
      status: 'pending',
      invite_code: code,
      invite_expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();
  if (error) throw error;

  return { staff: data, inviteCode: code };
}

// Staff redeems invite code and sets password
export async function redeemInviteCode({ inviteCode, password }) {
  // 1. Look up the invite
  const { data: staff, error: lookupError } = await supabase
    .from('staff')
    .select('*')
    .eq('invite_code', inviteCode)
    .eq('status', 'pending')
    .single();
  if (lookupError || !staff) throw new Error('Invalid or expired invite code.');

  // Check expiry
  if (new Date(staff.invite_expires_at) < new Date()) {
    throw new Error('Invite code has expired. Contact your admin.');
  }

  // 2. Create auth account
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: staff.email,
    password,
  });
  if (authError) throw authError;

  // 3. Link auth to staff record & activate
  const { data: updated, error: updateError } = await supabase
    .from('staff')
    .update({
      auth_id: authData.user.id,
      status: 'active',
      invite_code: null,
      invite_expires_at: null,
    })
    .eq('id', staff.id)
    .select()
    .single();
  if (updateError) throw updateError;

  return { user: authData.user, staff: updated };
}

// ============================================
// STAFF LOGIN
// ============================================

export async function staffLogin({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('*')
    .eq('auth_id', data.user.id)
    .single();
  if (staffError) throw staffError;

  return { user: data.user, session: data.session, staff };
}

// ============================================
// SHARED
// ============================================

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  return staff;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}