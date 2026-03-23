-- ================================================================
-- Performance Indexes — High Volume Support
-- Criado em: 2026-03-22
-- Objetivo: Evitar full table scans nas tabelas que crescem mais
-- ================================================================

-- analytics_events: todas as queries filtram por tenant + ordenam por created_at
CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant_created
  ON public.analytics_events(tenant_id, created_at DESC);

-- analytics_events: queries por tipo de evento dentro de um tenant
CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant_type
  ON public.analytics_events(tenant_id, event_type);

-- orders: queries listam por tenant + ordenam por created_at
CREATE INDEX IF NOT EXISTS idx_orders_tenant_created
  ON public.orders(tenant_id, created_at DESC);

-- orders: filtros por status de pagamento
CREATE INDEX IF NOT EXISTS idx_orders_tenant_payment_status
  ON public.orders(tenant_id, payment_status);

-- orders: filtros por status de envio
CREATE INDEX IF NOT EXISTS idx_orders_tenant_shipping_status
  ON public.orders(tenant_id, shipping_status);

-- customers: listagem por tenant + ordenação por data
CREATE INDEX IF NOT EXISTS idx_customers_tenant_created
  ON public.customers(tenant_id, created_at DESC);

-- quotes: listagem por tenant + ordenação por data
CREATE INDEX IF NOT EXISTS idx_quotes_tenant_created
  ON public.quotes(tenant_id, created_at DESC);

-- products: ordenação por preço dentro de um tenant (sort na vitrine)
CREATE INDEX IF NOT EXISTS idx_products_tenant_price
  ON public.products(tenant_id, price);

-- products: ordenação por data dentro de um tenant
CREATE INDEX IF NOT EXISTS idx_products_tenant_created
  ON public.products(tenant_id, created_at DESC);

-- products: filtro por categoria dentro de um tenant
CREATE INDEX IF NOT EXISTS idx_products_tenant_category
  ON public.products(tenant_id, category_id);

-- products: filtro por ativo dentro de um tenant
CREATE INDEX IF NOT EXISTS idx_products_tenant_active
  ON public.products(tenant_id, active);

-- page_views: queries de analytics de visualizações
CREATE INDEX IF NOT EXISTS idx_page_views_tenant_created
  ON public.page_views(tenant_id, created_at DESC);
