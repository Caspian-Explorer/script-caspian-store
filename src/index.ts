// --- Provider ---
export {
  CaspianStoreProvider,
  useCaspianStore,
  useCaspianLink,
  useCaspianImage,
  useCaspianNavigation,
  useCaspianCollections,
  useCaspianFirebase,
  type CaspianStoreProviderProps,
  type CaspianStoreContextValue,
} from './provider/caspian-store-provider';

// --- Hooks / contexts ---
export { useAuth } from './context/auth-context';
export { useScriptSettings } from './context/script-settings-context';

// --- Framework adapter types (for consumer wiring) ---
export type {
  CaspianLinkProps,
  CaspianLinkComponent,
  CaspianImageProps,
  CaspianImageComponent,
  CaspianNavigation,
  UseCaspianNavigation,
  FrameworkAdapters,
} from './primitives';
export {
  DefaultCaspianLink,
  DefaultCaspianImage,
  useDefaultCaspianNavigation,
} from './primitives';

// --- Components (Stage 0) ---
export { StarIcon } from './components/star-icon';
export {
  StarRatingInput,
  type StarRatingInputProps,
} from './components/star-rating-input';
export {
  ScriptSettingsPage,
  type ScriptSettingsPageProps,
} from './components/script-settings-page';

// --- Services ---
export {
  getProducts,
  getProductById,
  type ProductFilters,
} from './services/product-service';

// --- Types ---
export type {
  Product,
  ProductImage,
  ColorVariant,
  UserProfile,
  UserAddress,
  OrderStatus,
  ModerationStatus,
  FirestoreReview,
  FirestoreQuestion,
  CartItemRef,
  ScriptSettings,
  ThemeTokens,
  FeatureFlags,
} from './types';
export { DEFAULT_SCRIPT_SETTINGS } from './types';

// --- Utilities ---
export { cn } from './utils/cn';
