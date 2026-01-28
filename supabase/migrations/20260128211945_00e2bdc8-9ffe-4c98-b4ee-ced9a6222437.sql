-- Fix security definer views by recreating them with explicit security invoker
-- Drop and recreate views with proper security

DROP VIEW IF EXISTS public.admin_kpis;
DROP VIEW IF EXISTS public.admin_plan_distribution;
DROP VIEW IF EXISTS public.admin_users_view;

-- Recreate admin_kpis as a security invoker view (default)
CREATE VIEW public.admin_kpis 
WITH (security_invoker = true)
AS
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

-- Recreate plan distribution view
CREATE VIEW public.admin_plan_distribution 
WITH (security_invoker = true)
AS
SELECT 
    COALESCE(us.plan_type, 'Sem Plano') AS plan_name,
    COUNT(*) AS user_count
FROM public.profiles pr
LEFT JOIN public.user_subscriptions us ON pr.id = us.user_id AND us.is_active = true
GROUP BY us.plan_type
ORDER BY user_count DESC;

-- Recreate admin users view
CREATE VIEW public.admin_users_view 
WITH (security_invoker = true)
AS
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