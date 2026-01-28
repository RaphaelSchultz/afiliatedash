-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table (NOT on profiles - security best practice)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- 6. RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.has_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;

-- 8. Create admin_kpis view for dashboard statistics
CREATE OR REPLACE VIEW public.admin_kpis AS
SELECT 
    (SELECT COUNT(*) FROM public.profiles) AS total_users,
    (SELECT COUNT(*) FROM public.user_subscriptions WHERE is_active = true) AS active_subs,
    COALESCE(
        (SELECT SUM(p.price) 
         FROM public.user_subscriptions us 
         JOIN public.plans p ON us.plan_type = p.name 
         WHERE us.is_active = true), 
        0
    ) AS mrr,
    COALESCE(
        (SELECT SUM(p.price) * 12
         FROM public.user_subscriptions us 
         JOIN public.plans p ON us.plan_type = p.name 
         WHERE us.is_active = true), 
        0
    ) AS projected_revenue;

-- 9. Create plan distribution view
CREATE OR REPLACE VIEW public.admin_plan_distribution AS
SELECT 
    COALESCE(us.plan_type, 'Sem Plano') AS plan_name,
    COUNT(*) AS user_count
FROM public.profiles pr
LEFT JOIN public.user_subscriptions us ON pr.id = us.user_id AND us.is_active = true
GROUP BY us.plan_type
ORDER BY user_count DESC;

-- 10. Create admin users view (for user management)
CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT 
    pr.id,
    pr.full_name,
    pr.email,
    pr.created_at,
    pr.avatar_url,
    COALESCE(us.plan_type, 'Sem Plano') AS plan_type,
    COALESCE(us.is_active, false) AS subscription_active,
    us.started_at AS subscription_started,
    us.expires_at AS subscription_expires,
    EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id = pr.id AND ur.role = 'admin') AS is_admin
FROM public.profiles pr
LEFT JOIN public.user_subscriptions us ON pr.id = us.user_id AND us.is_active = true;

-- 11. RLS for plans table - allow admins full access
CREATE POLICY "Admins can manage plans"
ON public.plans
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 12. RLS for plan_features table - allow admins full access  
CREATE POLICY "Admins can manage plan features"
ON public.plan_features
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 13. Function to get admin stats (secure RPC)
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
BEGIN
    -- Check if user is admin
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;
    
    SELECT json_build_object(
        'kpis', (SELECT row_to_json(k) FROM admin_kpis k),
        'distribution', (SELECT json_agg(row_to_json(d)) FROM admin_plan_distribution d),
        'users', (SELECT json_agg(row_to_json(u) ORDER BY u.created_at DESC) FROM admin_users_view u)
    ) INTO result;
    
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_stats TO authenticated;