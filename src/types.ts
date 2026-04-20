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

// --- Script-level site configuration (new) ---

export interface ThemeTokens {
  primary: string;
  primaryForeground: string;
  accent: string;
  radius: string;
  fontFamily?: string;
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
  features: {
    reviews: true,
    questions: true,
    wishlist: true,
    promoCodes: true,
    guestCheckout: true,
    multiLanguage: false,
  },
};
