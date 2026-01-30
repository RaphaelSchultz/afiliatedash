-- Limpa planos e features existentes para evitar duplicação (CUIDADO: Use apenas se quiser resetar os planos)
DELETE FROM plan_features;
DELETE FROM plans;

-- ==============================================================================
-- 1. PLANO FREE (ISCA) - R$ 0,00
-- ==============================================================================
INSERT INTO plans (id, name, slug, price, button_text, button_link, subtitle, is_highlighted, order_index)
VALUES (
  gen_random_uuid(), 
  'Free', 
  'free', 
  0.00, 
  'Começar Grátis', 
  NULL, -- Plano grátis geralmente não tem link de checkout
  'Ideal para quem está começando', 
  false, 
  0
);

-- Features do Free
WITH p AS (SELECT id FROM plans WHERE slug = 'free')
INSERT INTO plan_features (plan_id, label, is_included, order_index)
SELECT id, label, is_included, idx FROM p, (VALUES 
  ('Gerador de Links (2 Links)', true, 1),
  ('Dashboard Completo', true, 2),
  ('Retenção de Dados (3 dias)', true, 3),
  ('Gestão de Investimentos', false, 4),
  ('Integração API Shopee', false, 5),
  ('Validação de Comissões', false, 6),
  ('Análise Mensal', false, 7)
) AS t(label, is_included, idx);


-- ==============================================================================
-- 2. PLANO STARTER (BÁSICO) - R$ 47,00
-- ==============================================================================
INSERT INTO plans (id, name, slug, price, button_text, button_link, subtitle, is_highlighted, order_index)
VALUES (
  gen_random_uuid(), 
  'Starter', 
  'basic', 
  47.00, 
  'Assinar Starter', 
  'https://pay.kirvano.com/seu-link-starter', -- SUBSTITUA PELO LINK REAL
  'Para afiliados em crescimento', 
  false, 
  1
);

-- Features do Starter
WITH p AS (SELECT id FROM plans WHERE slug = 'basic')
INSERT INTO plan_features (plan_id, label, is_included, order_index)
SELECT id, label, is_included, idx FROM p, (VALUES 
  ('Gerador de Links (20 Links)', true, 1),
  ('Dashboard Completo', true, 2),
  ('Retenção de Dados (7 dias)', true, 3),
  ('Análise de Investimentos (Total)', true, 4),
  ('Integração API Shopee', false, 5),
  ('Validação de Comissões', false, 6),
  ('Análise Mensal', false, 7)
) AS t(label, is_included, idx);


-- ==============================================================================
-- 3. PLANO SCALE (INTERMEDIÁRIO) - R$ 67,00
-- ==============================================================================
INSERT INTO plans (id, name, slug, price, button_text, button_link, subtitle, is_highlighted, order_index)
VALUES (
  gen_random_uuid(), 
  'Scale', 
  'intermediate', 
  67.00, 
  'Assinar Scale', 
  'https://pay.kirvano.com/seu-link-scale', -- SUBSTITUA PELO LINK REAL
  'Para quem precisa de mais dados', 
  true, -- Destaque
  2
);

-- Features do Scale
WITH p AS (SELECT id FROM plans WHERE slug = 'intermediate')
INSERT INTO plan_features (plan_id, label, is_included, order_index)
SELECT id, label, is_included, idx FROM p, (VALUES 
  ('Gerador de Links (50 Links)', true, 1),
  ('Dashboard Completo', true, 2),
  ('Retenção de Dados (30 dias)', true, 3),
  ('Investimentos Detalhados/Ilimitado', true, 4),
  ('Integração API Shopee', false, 5),
  ('Validação de Comissões', false, 6),
  ('Análise Mensal', false, 7)
) AS t(label, is_included, idx);


-- ==============================================================================
-- 4. PLANO PRO (AFILIADO ELITE) - R$ 97,00
-- ==============================================================================
INSERT INTO plans (id, name, slug, price, button_text, button_link, subtitle, is_highlighted, order_index)
VALUES (
  gen_random_uuid(), 
  'Afiliado Elite', 
  'pro', 
  97.00, 
  'Ser Elite', 
  'https://pay.kirvano.com/seu-link-pro', -- SUBSTITUA PELO LINK REAL
  'O pacote completo para profissionais', 
  false, 
  3
);

-- Features do Pro
WITH p AS (SELECT id FROM plans WHERE slug = 'pro')
INSERT INTO plan_features (plan_id, label, is_included, order_index)
SELECT id, label, is_included, idx FROM p, (VALUES 
  ('Gerador de Links (Ilimitado)', true, 1),
  ('Dashboard Completo', true, 2),
  ('Retenção de Dados (Vitalício)', true, 3),
  ('Investimentos Detalhados/Ilimitado', true, 4),
  ('Integração API Shopee (Auto)', true, 5),
  ('Validação de Comissões', true, 6),
  ('Análise Mensal', true, 7)
) AS t(label, is_included, idx);
