-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT,
  message TEXT NOT NULL,
  media_url TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their own tickets
CREATE POLICY "Users can view own tickets" ON support_tickets
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert tickets
CREATE POLICY "Users can insert tickets" ON support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all tickets (Scanning for admin rule usually involves a separate role or checking a profile, 
-- but for simplicity assuming we might need a specific admin policy later. 
-- For now, if the user is an admin they usually bypass RLS via service role or we add a policy based on a claim/profile).
-- Assuming there's an 'admins' table or profile 'role' field. 
-- Based on previous context, we haven't seen a strict 'admin' role RLS setup, 
-- usually simple apps just use the service role for admin dashboard or check metadata.
-- I'll add a policy that allows everything for now if we can verify admin, 
-- otherwise we'll stick to basic RLS and admin page uses client with appropriate rights or we assume 'public' for simplicity on this specific table if it's admin-only read.
-- Actually, let's look at `profiles` or similar if it exists. 
-- SAFE BET: Users insert, individual users select own. Admin page logic will likely be client-side filtered or use a specific admin check.

-- Let's check if 'profiles' has a role. If not, we'll just allow insert for now.
