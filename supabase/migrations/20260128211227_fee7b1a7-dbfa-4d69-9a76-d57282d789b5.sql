-- Create plans table
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  subtitle TEXT,
  is_highlighted BOOLEAN DEFAULT false,
  button_text TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plan_features table
CREATE TABLE public.plan_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_included BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

-- Plans are public (everyone can read)
CREATE POLICY "Anyone can view plans" ON public.plans FOR SELECT USING (true);

-- Plan features are public (everyone can read)
CREATE POLICY "Anyone can view plan features" ON public.plan_features FOR SELECT USING (true);

-- Insert Plano Básico
INSERT INTO public.plans (id, name, price, subtitle, is_highlighted, button_text, order_index)
VALUES ('11111111-1111-1111-1111-111111111111', 'Básico', 47, 'Para quem está começando', false, 'Plano Inferior', 1);

-- Insert Plano Intermediário
INSERT INTO public.plans (id, name, price, subtitle, is_highlighted, button_text, order_index)
VALUES ('22222222-2222-2222-2222-222222222222', 'Intermediário', 67, 'Para afiliados em crescimento', true, 'Fazer Upgrade', 2);

-- Insert Plano Afiliado PRO
INSERT INTO public.plans (id, name, price, subtitle, is_highlighted, button_text, order_index)
VALUES ('33333333-3333-3333-3333-333333333333', 'Afiliado PRO', 97, 'Para escalar resultados', false, 'Fazer Upgrade', 3);

-- Features for Básico
INSERT INTO public.plan_features (plan_id, label, is_included, order_index) VALUES
('11111111-1111-1111-1111-111111111111', 'Dashboard Completo', true, 1),
('11111111-1111-1111-1111-111111111111', 'Guarda planilhas (7 dias)', false, 2),
('11111111-1111-1111-1111-111111111111', 'Investimentos detalhados', false, 3),
('11111111-1111-1111-1111-111111111111', 'Integração API Shopee', false, 4),
('11111111-1111-1111-1111-111111111111', 'Análise Mensal', false, 5),
('11111111-1111-1111-1111-111111111111', 'Comissões a Validar', false, 6);

-- Features for Intermediário
INSERT INTO public.plan_features (plan_id, label, is_included, order_index) VALUES
('22222222-2222-2222-2222-222222222222', 'Dashboard Completo', true, 1),
('22222222-2222-2222-2222-222222222222', 'Guarda planilhas (30 dias)', true, 2),
('22222222-2222-2222-2222-222222222222', 'Investimentos Ilimitado', true, 3),
('22222222-2222-2222-2222-222222222222', 'Integração API Shopee', false, 4),
('22222222-2222-2222-2222-222222222222', 'Análise Mensal', false, 5),
('22222222-2222-2222-2222-222222222222', 'Comissões a Validar', false, 6);

-- Features for Afiliado PRO
INSERT INTO public.plan_features (plan_id, label, is_included, order_index) VALUES
('33333333-3333-3333-3333-333333333333', 'Dashboard Completo', true, 1),
('33333333-3333-3333-3333-333333333333', 'Guarda planilhas (Ilimitado)', true, 2),
('33333333-3333-3333-3333-333333333333', 'Investimentos Ilimitado', true, 3),
('33333333-3333-3333-3333-333333333333', 'Integração API Shopee', true, 4),
('33333333-3333-3333-3333-333333333333', 'Análise Mensal', true, 5),
('33333333-3333-3333-3333-333333333333', 'Comissões a Validar', true, 6);

-- Create indexes for better performance
CREATE INDEX idx_plan_features_plan_id ON public.plan_features(plan_id);
CREATE INDEX idx_plans_order ON public.plans(order_index);
CREATE INDEX idx_plan_features_order ON public.plan_features(order_index);