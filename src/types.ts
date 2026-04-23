import type { Timestamp } from 'firebase/firestore';
import type { ShippingPluginId } from './shipping/types';

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
  /**
   * Short marketing blurb shown in the PDP hero column above the Add-to-Cart
   * button. Kept separate from `description` so the storefront can show a
   * punchy 2–3 line pitch in the hero and the longer `description` in the
   * Details tab. Optional — falls back to the first ~240 chars of
   * `description` when empty.
   */
  shortDescription?: string;
  /**
   * Rich-text specs / dimensions rendered under the "Details" tab on the PDP.
   * Stored as sanitized HTML (allowlist: `<p>`, `<strong>`, `<ul>`, `<li>`,
   * `<br>`). Authored with the `<RichTextEditor>` in the admin product editor.
   * Optional — tab is hidden when empty and no `description` exists.
   */
  details?: string;
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
  /** Net weight in kilograms. Consumed by the Weight-Based shipping plugin; leave undefined if you don't use weight-based shipping. */
  weightKg?: number;
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
  /**
   * Payment method identifier. Stripe orders omit this (current default) or
   * set `'stripe'`; manual-payment orders (BACS / cheque / cash on delivery)
   * set it to the matching plugin id so admins can filter + display the
   * right "awaiting payment" instructions. Added in v2.8.
   */
  method?: 'stripe' | 'bacs' | 'cheque' | 'cod';
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
  | 'cancelled'
  /**
   * Order is awaiting manual payment confirmation (bank transfer, cheque, COD).
   * The shopper has checked out but payment has not yet cleared; the admin
   * marks the order `paid` (or `cancelled`) once the funds arrive. Added in v2.8.
   */
  | 'on-hold';

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

/**
 * Closed list of social-link platforms. Each value maps 1:1 to an icon in
 * `<SocialIcon>` — keep this in sync with `src/components/social-icon.tsx`.
 */
export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'x'
  | 'youtube'
  | 'tiktok'
  | 'linkedin'
  | 'pinterest';

export const SOCIAL_PLATFORMS: readonly SocialPlatform[] = [
  'instagram',
  'facebook',
  'twitter',
  'x',
  'youtube',
  'tiktok',
  'linkedin',
  'pinterest',
] as const;

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

/**
 * How tax is computed and rendered on the checkout page. See
 * `SiteSettings.taxMode` / `supportedCountries`.
 * - `flat`: every order uses the single `flatTaxRate`.
 * - `per-country`: per-entry `taxRate` on each row in `supportedCountries`;
 *   checkout reads the rate of the shopper's selected country.
 * - `none`: no tax row rendered anywhere.
 */
export type TaxMode = 'flat' | 'per-country' | 'none';

/**
 * A country the store sells to. Populates the country dropdown in checkout —
 * shoppers can only pick from this list. Under `taxMode: 'per-country'`, the
 * `taxRate` field is also consumed.
 */
export interface SupportedCountry {
  /** ISO 3166-1 alpha-2 code, uppercase (e.g. `US`, `GB`). */
  code: string;
  /** Display name used in the checkout country dropdown (e.g. `United States`). */
  name: string;
  /** Decimal tax rate 0–1 (e.g. `0.08` for 8%). Only used under per-country mode. */
  taxRate?: number;
}

/**
 * Coming Soon / Maintenance mode config. When `enabled: true`, the storefront
 * short-circuits to a branded splash for non-admin visitors. Admin routes and
 * (optionally) admin-authenticated viewers continue to see the real site.
 * Added in v2.7.
 */
export interface ComingSoonSettings {
  enabled: boolean;
  /** Optional override of the splash body copy. Defaults to "We're launching soon." */
  message?: string;
  /** When true, admin-authenticated viewers bypass the splash and see the real site. Default true. */
  allowAdminPreview: boolean;
}

/**
 * How prices render across the storefront (symbol position, separators,
 * decimals). Consumed by `formatCurrency`. When omitted, the library falls
 * back to `Intl.NumberFormat` defaults for the active locale. Added in v2.7.
 */
export interface CurrencyDisplay {
  /** Where the currency symbol sits relative to the number. */
  position: 'left' | 'right' | 'left_space' | 'right_space';
  /** Thousands separator. Typical values: `,`, `.`, ` `, `'`. */
  thousandSep: string;
  /** Decimal separator. Typical values: `.`, `,`. */
  decimalSep: string;
  /** Number of decimal places. Set to 0 for zero-decimal currencies (JPY, KRW). */
  decimals: number;
}

/**
 * Structured store address (WooCommerce-style). Replaces the single free-text
 * `contactAddress` field — that one stays for backward compat and is
 * best-effort-migrated into `line1` when this object is absent. Added in v2.7.
 */
export interface StoreAddress {
  line1: string;
  line2?: string;
  city: string;
  /** State / region / province / county — freeform if the country has no subdivisions. */
  stateOrRegion: string;
  /** ISO 3166-1 alpha-2 country code (e.g. `US`, `GB`). */
  country: string;
  postcode: string;
}

/**
 * Review-submission policy toggles. Enforced by the `createReview` service;
 * `showVerifiedBadge` is read by the review card. Added in v2.7.
 */
export interface ReviewPolicy {
  /** When true, non-verified buyers are rejected at `createReview`. */
  restrictToVerifiedBuyers: boolean;
  /** When true, `createReview` rejects submissions without a star rating. */
  requireStarRating: boolean;
  /** When false, the "verified purchase" badge is hidden even on verified reviews. Default true. */
  showVerifiedBadge: boolean;
}

/**
 * Cart / add-to-cart behavior toggles read by PLP and PDP handlers. Added in v2.7.
 */
export interface CartBehavior {
  /** When true, clicking add-to-cart navigates the shopper to `/cart`. Default false. */
  redirectToCartAfterAdd: boolean;
  /** Reserved for future: async add-to-cart from product list pages without a full-page round trip. */
  ajaxOnArchives: boolean;
}

/**
 * Global inventory settings consumed by storefront badging, PLP filtering,
 * and the per-product stock fields in the admin product editor. Per-size
 * stock counts live on `Product.stock`. Added in v2.9.
 */
export interface InventorySettings {
  /** Master toggle. When false, all of the toggles below are inert and stock is not displayed. */
  trackStock: boolean;
  /** Total units across all sizes at or below this number trigger the "low stock" badge. */
  lowStockThreshold: number;
  /** Per-size unit count at or below this number is considered out of stock. Defaults to 0. */
  outOfStockThreshold: number;
  /**
   * Catalog visibility for products that are entirely out of stock (every size at or below
   * `outOfStockThreshold`). `'show'` keeps them visible (with badge); `'hide'` filters them
   * out of `getProducts` results.
   */
  outOfStockVisibility: 'show' | 'hide';
  /**
   * When badges render. `'always'` shows in-stock count on every card; `'low'` only shows
   * a badge when stock is at or below `lowStockThreshold`; `'never'` suppresses badges.
   */
  stockDisplay: 'always' | 'low' | 'never';
}

/**
 * Global shipping checkout-behavior toggles consumed by `<CheckoutPage>` when
 * computing which rates to render. Added in v2.9.
 */
export interface ShippingOptions {
  /**
   * When true, the checkout shipping picker stays empty until the shopper
   * has entered a country *and* a postal code. Useful when zone-derived
   * rates would otherwise mislead the customer pre-address.
   */
  hideRatesUntilAddressEntered: boolean;
  /**
   * When true and any visible rate resolves to `0` (free), the picker hides
   * every paid option so the shopper is automatically given the free rate.
   */
  hideRatesWhenFreeAvailable: boolean;
}

/**
 * Account-creation policy. Subsumes the legacy `FeatureFlags.guestCheckout`
 * toggle on `ScriptSettings` — when `accounts.allowGuestCheckout` is set, it
 * takes precedence; otherwise the legacy flag is read as a fallback for
 * pre-v2.10 stores. Added in v2.10.
 */
export interface AccountSettings {
  /**
   * When true, shoppers can complete checkout without a full email+password
   * account — the storefront signs them in with Firebase anonymous auth so
   * Firestore rules still pass. Requires Anonymous sign-in to be enabled in
   * Firebase Authentication.
   */
  allowGuestCheckout: boolean;
  /** When true, the checkout shows a "Create an account" option for shoppers who aren't signed in. */
  allowAccountCreationAtCheckout: boolean;
  /** When true, the My Account / register page accepts new sign-ups. When false, the page renders a "registration disabled" notice. */
  allowAccountCreationOnMyAccount: boolean;
  /**
   * When true, new registrations skip the "pick a password" step — the
   * storefront generates a random password, signs the user in, and emails
   * them a password-reset link so they can pick a real password on their
   * own terms. Useful for purchase-flow sign-ups.
   */
  sendPasswordSetupLink: boolean;
}

/**
 * GDPR-style personal-data retention. Every field is optional — `undefined`
 * means "keep indefinitely". A scheduled Cloud Function in `functions-admin`
 * reads these values daily and deletes eligible docs from Firestore (and
 * matching auth users). Added in v2.10.
 */
export interface PrivacyRetentionSettings {
  /** Delete user docs (and their Auth record) with no activity for this many days. */
  retainInactiveAccountsDays?: number;
  /** Delete orders in status `'cancelled'` older than this many days. */
  retainCancelledOrdersDays?: number;
  /** Delete orders in a failed / errored state older than this many days. */
  retainFailedOrdersDays?: number;
  /** Delete orders in status `'delivered'` older than this many days. */
  retainCompletedOrdersDays?: number;
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
  /** ISO 4217 currency code (e.g. `USD`, `EUR`). Optional — added in v1.19. */
  currency?: string;
  /** IANA timezone (e.g. `America/New_York`). Optional — added in v1.19. */
  timezone?: string;
  /** ISO 3166-1 alpha-2 country code (e.g. `US`, `GB`). Optional — added in v1.19. */
  country?: string;
  /**
   * Tax calculation mode. When `undefined` or `'none'`, no tax row renders on
   * the checkout. When `'flat'`, `flatTaxRate` applies site-wide. When
   * `'per-country'`, the rate is read from the selected country's entry in
   * `supportedCountries`. Added in v2.5.
   */
  taxMode?: TaxMode;
  /** Display label for the tax row (e.g. `Sales tax`, `VAT`). Defaults to "Tax". Added in v2.5. */
  taxLabel?: string;
  /** Decimal tax rate 0–1 used under `taxMode: 'flat'`. Ignored otherwise. Added in v2.5. */
  flatTaxRate?: number;
  /**
   * Countries the store sells to. When populated, the checkout country
   * dropdown is restricted to this list. When empty or undefined, the library
   * falls back to the global ISO 3166 list. Added in v2.5.
   */
  supportedCountries?: SupportedCountry[];
  /** Maintenance / pre-launch splash. Added in v2.7. */
  comingSoon?: ComingSoonSettings;
  /** Price formatting overrides. Added in v2.7. */
  currencyDisplay?: CurrencyDisplay;
  /**
   * Structured physical store address. When set, overrides `contactAddress`
   * everywhere it's rendered. Added in v2.7.
   */
  storeAddress?: StoreAddress;
  /** Review submission policy. Added in v2.7. */
  reviewPolicy?: ReviewPolicy;
  /** Add-to-cart behavior. Added in v2.7. */
  cartBehavior?: CartBehavior;
  /** Inventory tracking + display config. Added in v2.9. */
  inventory?: InventorySettings;
  /** Checkout shipping rate display rules. Added in v2.9. */
  shippingOptions?: ShippingOptions;
  /** Account-creation policy (guest checkout, registration gating). Added in v2.10. */
  accounts?: AccountSettings;
  /** Personal-data retention policy read by the scheduled cleanup Cloud Function. Added in v2.10. */
  privacy?: PrivacyRetentionSettings;
  socialLinks: SocialLink[];
}

export interface SearchTerm {
  id: string;
  term: string;
  count: number;
  firstSearchedAt?: Timestamp;
  lastSearchedAt?: Timestamp;
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

export interface ShippingPluginInstall {
  id: string;
  /** Which built-in plugin handles this install (flat-rate, free-shipping, etc.). */
  pluginId: ShippingPluginId;
  /** Merchant-authored display label shown to shoppers (e.g. "Standard", "Weekend Express"). */
  name: string;
  /** When false, the install is hidden from checkout and the public shipping page. */
  enabled: boolean;
  order: number;
  estimatedDays: { min: number; max: number };
  /** Plugin-specific configuration. Validated by the plugin's `validateConfig` at runtime. */
  config: Record<string, unknown>;
  /**
   * ISO 3166-1 alpha-2 codes of countries this shipping method is available
   * in. Empty or undefined → all `SiteSettings.supportedCountries`. Added in v2.5.
   */
  eligibleCountries?: string[];
  createdAt: Timestamp;
}

export interface PaymentPluginInstall {
  id: string;
  /** Which built-in plugin handles this install (currently: 'stripe'). */
  pluginId: string;
  /** Merchant-authored display label shown in admin (e.g. "Stripe — Production"). */
  name: string;
  /**
   * Optional merchant-authored blurb shown to shoppers at checkout under the
   * gateway name (e.g. "Pay securely with Stripe"). When absent, checkout
   * falls back to the plugin's catalog description. Added in v2.8.
   */
  description?: string;
  /** When false, `useCheckout` skips this install. */
  enabled: boolean;
  order: number;
  /** Plugin-specific configuration. Validated by the plugin's `validateConfig` at runtime. */
  config: Record<string, unknown>;
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

/**
 * A single item in the admin setup / operational todo list. Used by
 * `<AdminTodoPage>` to track first-run actions ("deploy rules", "configure
 * Stripe", etc.) and any follow-up tasks the admin adds. `isDefault` marks
 * the seeded first-run tasks so they render distinctly.
 */
export interface AdminTodo {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  order: number;
  isDefault: boolean;
  createdAt: Timestamp;
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
  /**
   * @deprecated Superseded by `SiteSettings.accounts.allowGuestCheckout` in v2.10.
   * Kept for backward compat — read as a fallback when `accounts` is absent.
   */
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
  theme: {
    primary: '#111111',
    primaryForeground: '#ffffff',
    accent: '#171717',
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
