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
export { useCart } from './context/cart-context';
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

// --- Storefront components ---
export { StarIcon } from './components/star-icon';
export { StarRatingInput, type StarRatingInputProps } from './components/star-rating-input';
export { ProductCard, type ProductCardProps } from './components/product-card';
export { ProductGrid, type ProductGridProps } from './components/product-grid';
export { ProductListPage, type ProductListPageProps } from './components/product-list-page';
export { ProductGallery } from './components/product-gallery';
export { SizeSelector, QuantitySelector } from './components/product-selectors';
export { ProductDetailPage, type ProductDetailPageProps } from './components/product-detail-page';
export { CartSheet, type CartSheetProps } from './components/cart-sheet';
export { CheckoutPage, type CheckoutPageProps } from './components/checkout-page';
export {
  OrderConfirmationPage,
  type OrderConfirmationPageProps,
} from './components/order-confirmation-page';
export {
  OrderHistoryList,
  type OrderHistoryListProps,
} from './components/order-history-list';
export { WishlistButton, type WishlistButtonProps } from './components/wishlist-button';

// Reviews & Questions
export { ProductReviews, type ReviewSummaryData } from './components/reviews/product-reviews';
export { ReviewSummary } from './components/reviews/review-summary';
export { ReviewList } from './components/reviews/review-list';
export { ReviewItem } from './components/reviews/review-item';
export { QuestionList } from './components/reviews/question-list';
export { QuestionItem } from './components/reviews/question-item';
export { WriteReviewDialog } from './components/reviews/write-review-dialog';
export { AskQuestionDialog } from './components/reviews/ask-question-dialog';

// Script settings
export {
  ScriptSettingsPage,
  type ScriptSettingsPageProps,
} from './components/script-settings-page';

// --- UI primitives (consumable) ---
export {
  Button,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
  Input,
  Textarea,
  Label,
  Dialog,
  type DialogProps,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  type TabsProps,
  Select,
  type SelectProps,
  type SelectOption,
  Skeleton,
  Badge,
  Avatar,
  Separator,
  useToast,
  type ToastMessage,
} from './ui';

// --- Services ---
export {
  getProducts,
  getProductById,
  getProductsByIds,
  getRelatedProducts,
  type ProductFilters,
} from './services/product-service';
export {
  getApprovedReviewsForProduct,
  hasUserReviewedProduct,
  createReview,
  listAllReviews,
  setReviewStatus,
  deleteReview,
  type ReviewSortBy,
  type CreateReviewInput,
  type CreateReviewAuthor,
} from './services/review-service';
export {
  getApprovedQuestionsForProduct,
  createQuestion,
  listAllQuestions,
  setQuestionStatus,
  answerQuestion,
  deleteQuestion,
  type CreateQuestionInput,
  type CreateQuestionAuthor,
} from './services/question-service';
export {
  hasUserPurchasedProduct,
  getOrderById,
  getOrdersByUser,
} from './services/order-service';
export { loadUserCart, saveUserCart } from './services/cart-service';
export { addToWishlist, removeFromWishlist } from './services/wishlist-service';

// --- Client hooks ---
export { useCheckout, type StartCheckoutOptions } from './hooks/use-checkout';
export { useWishlist } from './hooks/use-wishlist';

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
  CartItem,
  FirestoreCart,
  Order,
  OrderItem,
  OrderPayment,
  ShippingInfo,
  ScriptSettings,
  ThemeTokens,
  FeatureFlags,
} from './types';
export { DEFAULT_SCRIPT_SETTINGS } from './types';

// --- Utilities ---
export { cn } from './utils/cn';
