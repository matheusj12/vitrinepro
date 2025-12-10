export interface Tenant {
  id: string;
  user_id: string | null;
  company_name: string;
  slug: string;
  email: string | null;
  whatsapp_number: string | null;
  primary_color: string;
  subscription_status: string;
  trial_ends_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  price: number | null;
  min_quantity: number;
  image_url: string | null;
  featured: boolean;
  active: boolean;
  stock_control_enabled: boolean;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
  // Novos campos de multimídia
  images?: string[];         // até 5 URLs
  video_url?: string | null; // URL do vídeo (mp4, mov ou link externo)
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  position: number;
  created_at: string;
}

export interface ProductVariation {
  id: string;
  product_id: string;
  variation_type: string;
  variation_value: string;
  price_adjustment: number;
  sku_suffix: string | null;
  stock_quantity: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: string;
  tenant_id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  link: string | null;
  active: boolean;
  order_position: number;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  tenant_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_whatsapp: string;
  observations: string | null;
  message_text: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id: string | null;
  product_name: string;
  sku: string | null;
  quantity: number;
  price: number | null;
  created_at: string;
}

export interface StoreSettings {
  id: string;
  tenant_id: string;
  branding: any;
  storefront: any;
  contact: any;
  theme_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Theme {
  id: string;
  name: string;
  slug: string;
  type: 'free' | 'pro';
  config: {
    layout?: string;
    productCard?: any;
    header?: any;
    banner?: any;
    colors?: any;
    grid?: {
      columns?: {
        mobile?: number;
        tablet?: number;
        desktop?: number;
      };
      gap?: string;
      masonry?: boolean;
    };
    features?: any;
    animations?: any;
  };
  active: boolean;
  created_at: string;
}

export interface TenantMembership {
  id: string;
  tenant_id: string;
  user_id: string;
  role: number;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  max_products: number;
  trial_days: number;
  features: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: string;
  started_at: string;
  trial_ends_at: string | null;
  payment_confirmed: boolean;
  payment_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminLog {
  id: string;
  action: string;
  tenant_id: string | null;
  user_id: string | null;
  meta: any;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  tenant_id: string;
  event_type: string;
  product_id: string | null;
  meta: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  tenant_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}