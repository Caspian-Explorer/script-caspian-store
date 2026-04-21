import type { Timestamp } from 'firebase/firestore';

// --- Core e-commerce types ---

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  hint: string;
}

export interface ColorVariant {
  name: string;
  imageUrl: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  images: ProductImage[];
  category: string;
  isNew?: boolean;
  limited?: boolean;
  sizes?: string[];
  color?: string;
  colorVariants?: ColorVariant[];
  stock?: Record<string, number>;
  isActive?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CartItemRef {
  productId: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

/** Cart item = a cart line hydrated with its Product snapshot. */
export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface FirestoreCart {
  items: CartItemRef[];
  updatedAt: Timestamp;
}

export interface OrderItem {
  productId: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  selectedSize: string | null;
  selectedColor: string | null;
  imageUrl: string;
}

export interface OrderPayment {
  stripeSessionId: string;
  last4: string;
  brand: string;
  amount: number;
}

export interface ShippingInfo {
  name: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  shippingMethod: string;
  orderNotes?: string;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  status: OrderStatus;
  items: OrderItem[];
  shippingInfo: ShippingInfo;
  payment: OrderPayment;
  subtotal: number;
  shippingCost: number;
  discount: number;
  promoCode: string | null;
  total: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface UserAddress {
  id: string;
  name: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: 'customer' | 'admin';
  addresses: UserAddress[];
  wishlist: string[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface FirestoreReview {
  id: string;
  productId: string;
  userId: string;
  author: string;
  photoURL: string | null;
  rating: number;
  text: string;
  createdAt: Timestamp;
  isVerifiedPurchase: boolean;
  status: ModerationStatus;
}

export interface FirestoreQuestion {
  id: string;
  productId: string;
  userId: string;
  author: string;
  photoURL: string | null;
  text: string;
  createdAt: Timestamp;
  answer: string | null;
  answeredAt: Timestamp | null;
  answeredByUid: string | null;
  status: ModerationStatus;
}

// --- Admin-managed content types (v1.1+) ---

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  order: number;
}

export interface JournalArticle {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  imageUrl: string;
  content: string;
  createdAt: Timestamp;
}

export interface Subscriber {
  id: string;
  email: string;
  subscribedAt: Timestamp;
}

export interface SocialLink {
  platform: string;
  url: string;
  label?: string;
}

export interface SiteSettings {
  logoUrl: string;
  faviconUrl?: string;
  brandName: string;
  brandDescription: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  businessHours: string;
  socialLinks: SocialLink[];
}

export interface PromoCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  isActive: boolean;
  createdAt: Timestamp;
}

/** Client-side shape after a promo code has been validated against a subtotal. */
export interface AppliedPromoCode {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  discountAmount: number;
}

export interface ShippingMethod {
  id: string;
  slug: string;
  name: string;
  price: number;
  estimatedDays: { min: number; max: number };
  isActive: boolean;
  order: number;
  createdAt: Timestamp;
}

export interface ProductCategoryDoc {
  id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  isActive: boolean;
  isFeatured?: boolean;
  imageUrl?: string;
  parentId?: string | null;
  path?: string[];
  depth?: number;
  createdAt: Timestamp;
}

export interface ProductBrandDoc {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Timestamp;
}

export interface ProductCollectionDoc {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  productIds: string[];
  isActive: boolean;
  isFeatured?: boolean;
  order: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface PageContent {
  id: string;
  pageKey: string;
  title: string;
  subtitle?: string;
  content: string;
  updatedAt: Timestamp;
}

export interface LanguageDoc {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
  isDefault: boolean;
  isActive: boolean;
  direction: 'ltr' | 'rtl';
  order: number;
  updatedAt?: Timestamp;
}

// --- Script-level site configuration (new) ---

export interface ThemeTokens {
  primary: string;
  primaryForeground: string;
  accent: string;
  radius: string;
  fontFamily?: string;
}

export interface FontTokens {
  body: string;
  headline: string;
  /** Optional Google Fonts family list (e.g. `Montserrat:wght@400;700`). When set the provider injects the <link> tag. */
  googleFamilies?: string[];
}

export interface HeroTokens {
  title: string;
  subtitle: string;
  cta: string;
  /** Optional call-to-action destination (default: /products). */
  ctaHref?: string;
  imageUrl?: string;
}

/** Rows of a single size table rendered by `<SizeGuidePage>`. */
export interface SizeTableRow {
  /** Free-form label for the left-most column (e.g. 'XS', 'S', '6', 'EU 39'). */
  label: string;
  /** The remaining columns keyed by header. */
  [column: string]: string;
}

export interface SizeTable {
  /** Heading shown above the table. */
  title: string;
  /** Column headers in display order. The first entry is the label column. */
  columns: string[];
  rows: SizeTableRow[];
}

export interface SizeGuideConfig {
  tips?: string;
  tables: SizeTable[];
}

export interface FeatureFlags {
  reviews: boolean;
  questions: boolean;
  wishlist: boolean;
  promoCodes: boolean;
  guestCheckout: boolean;
  multiLanguage: boolean;
}

export interface ScriptSettings {
  id: 'site';
  brandName: string;
  brandDescription: string;
  defaultCurrency: string;
  defaultLocale: string;
  supportedLocales: string[];
  stripePublicKey: string | null;
  theme: ThemeTokens;
  /** Optional — added in v1.1 for later phases. Consumers can ignore. */
  fonts?: FontTokens;
  /** Optional — added in v1.1 for later phases. Consumers can ignore. */
  hero?: HeroTokens;
  /** Optional — added in v1.4. Drives the `<SizeGuidePage />`. */
  sizeGuide?: SizeGuideConfig;
  features: FeatureFlags;
  updatedAt: Timestamp;
}

export const DEFAULT_SCRIPT_SETTINGS: Omit<ScriptSettings, 'updatedAt'> = {
  id: 'site',
  brandName: 'My Store',
  brandDescription: 'Powered by Caspian Store',
  defaultCurrency: 'USD',
  defaultLocale: 'en',
  supportedLocales: ['en'],
  stripePublicKey: null,
  theme: {
    primary: '#111111',
    primaryForeground: '#ffffff',
    accent: '#f5a8b8',
    radius: '0.5rem',
  },
  fonts: {
    body: 'system-ui, -apple-system, sans-serif',
    headline: 'system-ui, -apple-system, sans-serif',
  },
  hero: {
    title: 'Shop our latest collection',
    subtitle: 'Curated essentials delivered to your door.',
    cta: 'Shop now',
    ctaHref: '/products',
  },
  features: {
    reviews: true,
    questions: true,
    wishlist: true,
    promoCodes: true,
    guestCheckout: true,
    multiLanguage: false,
  },
};
