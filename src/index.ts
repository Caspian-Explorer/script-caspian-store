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

// Homepage surface (v1.2)
export {
  Hero,
  FeaturedCategoriesSection,
  TrendingProductsSection,
  NewsletterSignup,
  HomePage,
  type HeroProps,
  type FeaturedCategoriesSectionProps,
  type TrendingProductsSectionProps,
  type NewsletterSignupProps,
  type HomePageProps,
} from './components/home';

// Journal surface (v1.3)
export {
  JournalListPage,
  JournalDetailPage,
  type JournalListPageProps,
  type JournalDetailPageProps,
} from './components/journal';

// Content-page surface (v1.3)
export {
  PageContentView,
  type PageContentViewProps,
} from './components/content';

// FAQs + shipping + size guide (v1.4)
export { FaqsPage, type FaqsPageProps } from './components/faqs';
export {
  ShippingReturnsPage,
  type ShippingReturnsPageProps,
} from './components/shipping';
export {
  SizeGuidePage,
  DEFAULT_SIZE_GUIDE,
  type SizeGuidePageProps,
} from './components/size-guide';

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

// Auth pages + account surface
export {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ProfileCard,
  AddressBook,
  ChangePasswordCard,
  ProfilePhotoCard,
  DeleteAccountCard,
  AccountPage,
  type LoginPageProps,
  type RegisterPageProps,
  type ForgotPasswordPageProps,
  type AccountPageProps,
} from './components/auth';

// i18n
export {
  LocaleProvider,
  useT,
  useLocale,
  useDirection,
  useFormatNumber,
  useFormatCurrency,
  useFormatDate,
  DEFAULT_MESSAGES,
  interpolate,
  isRtl,
  LocaleSwitcher,
  type LocaleProviderProps,
  type TranslateFn,
  type MessageDict,
  type LocaleSwitcherProps,
  type LocaleOption,
} from './i18n';

// Theming presets
export {
  THEME_PRESETS,
  THEME_PRESET_LABELS,
  ThemePresetPicker,
  type ThemePresetName,
  type ThemePresetPickerProps,
} from './theme';

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
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from './ui';

// --- Services ---
export {
  getProducts,
  getProductById,
  getProductsByIds,
  getRelatedProducts,
  listAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type ProductFilters,
  type ProductWriteInput,
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
  listAllOrders,
  updateOrderStatus,
} from './services/order-service';
export { loadUserCart, saveUserCart } from './services/cart-service';
export { addToWishlist, removeFromWishlist } from './services/wishlist-service';
export {
  updateDisplayName,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from './services/user-service';
export {
  uploadProfilePhoto,
  removeProfilePhoto,
  MAX_PROFILE_PHOTO_BYTES,
  ALLOWED_PROFILE_PHOTO_TYPES,
  type UploadProfilePhotoInput,
} from './services/storage-service';

// --- Client hooks ---
export {
  useCheckout,
  type StartCheckoutOptions,
  type CheckoutShippingInfoInput,
} from './hooks/use-checkout';
export { useWishlist } from './hooks/use-wishlist';
export { validatePromoCode } from './services/promo-code-service';
export { listActiveCategories, getFeaturedCategories } from './services/category-service';
export {
  subscribeEmail,
  type SubscribeResult,
} from './services/subscriber-service';
export {
  listJournalArticles,
  getJournalArticle,
  createJournalArticle,
  updateJournalArticle,
  deleteJournalArticle,
  type JournalArticleWriteInput,
} from './services/journal-service';
export {
  getPageContent,
  listPageContents,
  savePageContent,
  type SavePageContentInput,
} from './services/page-content-service';
export {
  listFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  type FaqWriteInput,
} from './services/faq-service';
export {
  listShippingMethods,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  type ShippingMethodWriteInput,
} from './services/shipping-method-service';
export {
  uploadAdminImage,
  deleteStorageObject,
} from './services/storage-service';

// --- Admin surface ---
export {
  AdminGuard,
  AdminShell,
  DEFAULT_ADMIN_NAV,
  AdminDashboard,
  AdminProductsList,
  AdminProductEditor,
  AdminOrdersList,
  AdminOrderDetail,
  AdminReviewsModeration,
  AdminJournalPage,
  AdminPagesPage,
  AdminFaqsPage,
  AdminShippingPage,
  DEFAULT_PAGE_KEYS,
  type AdminGuardProps,
  type AdminShellProps,
  type AdminNavItem,
  type AdminDashboardProps,
  type AdminProductsListProps,
  type AdminProductEditorProps,
  type AdminOrdersListProps,
  type AdminOrderDetailProps,
  type AdminPagesPageProps,
  type AdminFaqsPageProps,
} from './admin';

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
  FontTokens,
  HeroTokens,
  SizeTableRow,
  SizeTable,
  SizeGuideConfig,
  FeatureFlags,
  // v1.1 additions — Firestore admin types
  FaqItem,
  JournalArticle,
  Subscriber,
  SocialLink,
  SiteSettings,
  PromoCode,
  AppliedPromoCode,
  ShippingMethod,
  ProductCategoryDoc,
  ProductBrandDoc,
  ProductCollectionDoc,
  PageContent,
  LanguageDoc,
} from './types';
export { DEFAULT_SCRIPT_SETTINGS } from './types';

// --- Utilities ---
export { cn } from './utils/cn';
