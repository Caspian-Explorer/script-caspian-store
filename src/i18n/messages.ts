/**
 * Default English strings. Consumers can override individual keys via
 * `<CaspianStoreProvider messages={{ ... }}>`, or ship a completely different
 * locale by providing a full dictionary. For multi-locale sites, pass
 * `messagesByLocale={{ en: {...}, ar: {...}, ... }}` instead.
 *
 * Keys are flat dot-notation so overrides can target any subset.
 */

export type MessageDict = Record<string, string>;

export const DEFAULT_MESSAGES: MessageDict = {
  // Common
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.loading': 'Loading…',
  'common.back': 'Back',

  // Auth — Login
  'auth.login.title': 'Sign in',
  'auth.login.subtitle': 'Welcome back. Sign in to continue.',
  'auth.login.email': 'Email',
  'auth.login.password': 'Password',
  'auth.login.rememberMe': 'Remember me',
  'auth.login.forgotPassword': 'Forgot password?',
  'auth.login.submit': 'Sign in',
  'auth.login.submitting': 'Signing in…',
  'auth.login.googleCta': 'Continue with Google',
  'auth.login.noAccount': "Don't have an account?",
  'auth.login.createOne': 'Create one',
  'auth.login.failed': 'Sign-in failed',
  'auth.login.failedDesc': 'Check your email and password.',

  // Auth — Register
  'auth.register.title': 'Create your account',
  'auth.register.subtitle': 'A quick sign-up lets you track orders and save favorites.',
  'auth.register.name': 'Full name',
  'auth.register.confirmPassword': 'Confirm password',
  'auth.register.submit': 'Create account',
  'auth.register.submitting': 'Creating account…',
  'auth.register.hasAccount': 'Already have an account?',
  'auth.register.signIn': 'Sign in',
  'auth.register.failed': 'Sign-up failed',
  'auth.register.passwordMismatch': 'Passwords do not match',
  'auth.register.passwordTooShort': 'Password must be at least {min} characters',
  'auth.register.nameRequired': 'Please enter your name',

  // Auth — Forgot password
  'auth.forgot.title': 'Reset your password',
  'auth.forgot.subtitle': "Enter your email and we'll send a reset link.",
  'auth.forgot.submit': 'Send reset link',
  'auth.forgot.submitting': 'Sending…',
  'auth.forgot.successTitle': 'Check your inbox',
  'auth.forgot.successDesc': 'We sent a password reset link to {email}.',
  'auth.forgot.backToLogin': 'Back to sign in',
  'auth.forgot.failed': 'Reset failed',
  'auth.forgot.failedDesc': 'Please check the email address.',

  // Account
  'account.title': 'My account',
  'account.signedInAs': 'Signed in as {name}',
  'account.signOut': 'Sign out',
  'account.signInRequired.title': 'Sign in to your account',
  'account.signInRequired.subtitle': 'Manage orders, addresses, and preferences.',
  'account.sections.recentOrders': 'Recent orders',

  // Profile card
  'profile.title': 'Profile',
  'profile.displayName': 'Display name',
  'profile.email': 'Email',
  'profile.nameRequired': 'Name is required',
  'profile.updated': 'Profile updated',
  'profile.saveFailed': 'Save failed',

  // Address book
  'addresses.title': 'Addresses',
  'addresses.add': '+ Add address',
  'addresses.empty': 'No addresses yet. Add one for faster checkout.',
  'addresses.default': 'Default',
  'addresses.setDefault': 'Set default',
  'addresses.editTitle': 'Edit address',
  'addresses.addTitle': 'Add address',
  'addresses.fullName': 'Full name',
  'addresses.address': 'Address',
  'addresses.city': 'City',
  'addresses.zip': 'ZIP',
  'addresses.country': 'Country',
  'addresses.makeDefault': 'Set as default address',
  'addresses.added': 'Address added',
  'addresses.updated': 'Address updated',
  'addresses.deleted': 'Address deleted',
  'addresses.saveFailed': 'Save failed',
  'addresses.deleteConfirm': 'Delete address "{name}"?',

  // Password
  'password.title': 'Password',
  'password.change': 'Change',
  'password.googleHint': 'You signed in with Google — manage your password in your Google account.',
  'password.subtitle': 'Change your sign-in password.',
  'password.current': 'Current password',
  'password.new': 'New password',
  'password.confirmNew': 'Confirm new password',
  'password.update': 'Update password',
  'password.updated': 'Password updated',
  'password.mismatch': 'Passwords do not match',
  'password.tooShort': 'Password must be at least {min} characters',
  'password.wrongCurrent': 'Current password is incorrect',
  'password.updateFailed': 'Password change failed',
  'password.noEmail': 'No email associated with this account',

  // Photo
  'photo.title': 'Profile photo',
  'photo.change': 'Change photo',
  'photo.remove': 'Remove',
  'photo.uploading': 'Uploading…',
  'photo.uploaded': 'Profile photo updated',
  'photo.uploadFailed': 'Upload failed',
  'photo.removed': 'Photo removed',
  'photo.invalidType': 'Please select a JPEG, PNG, or WebP image.',
  'photo.tooLarge': 'Image must be under {max} MB.',

  // Delete account
  'deleteAccount.title': 'Delete account',
  'deleteAccount.description':
    'Permanently delete your profile, addresses, and wishlist. Order history is preserved for our records.',
  'deleteAccount.cta': 'Delete my account',
  'deleteAccount.typeToConfirm': 'Type {text} to confirm',
  'deleteAccount.passwordPrompt': 'Re-enter your password',
  'deleteAccount.confirm': 'Permanently delete',
  'deleteAccount.success': 'Your account has been deleted.',
  'deleteAccount.failed': 'Delete failed',

  // Sign-in gate (shared)
  'signInGate.required': 'Sign in required',
  'signInGate.signInLink': 'Sign in',
  'signInGate.accessDenied': 'Access denied',
  'signInGate.needAdminRole':
    "Your account doesn't have the admin role. Ask an existing admin to promote your user.",
  'signInGate.adminRequired': 'Admin pages require an authenticated account.',

  // Product card / grid
  'storefront.noImage': 'No image',
  'storefront.badges.new': 'New',
  'storefront.badges.limited': 'Limited',
  'storefront.badges.newArrival': 'New Arrival',
  'storefront.empty': 'No products found.',

  // Product detail page
  'product.size': 'Size',
  'product.quantity': 'Quantity',
  'product.addToCart': 'Add to cart',
  'product.addedToCart': 'Added to cart',
  'product.selectSize': 'Select a size',
  'product.description': 'Description',
  'product.notFound': 'Product not found.',
  'product.reviewsSummary': '{avg} ★ · {count} reviews',

  // Reviews & Q&A
  'reviews.title': 'Product Reviews',
  'reviews.count': '{count} reviews',
  'reviews.rateItNow': 'Rate it now.',
  'reviews.haveQuestions': 'Have any questions?',
  'reviews.writeReview': 'Write a Review',
  'reviews.askQuestion': 'Ask a Question',
  'reviews.tab.reviews': 'Reviews ({count})',
  'reviews.tab.questions': 'Questions ({count})',
  'reviews.sortBy': 'Sort by:',
  'reviews.sort.recent': 'Most Recent',
  'reviews.sort.highest': 'Highest Rated',
  'reviews.sort.lowest': 'Lowest Rated',
  'reviews.verifiedPurchase': 'Verified Purchase',
  'reviews.empty': 'No reviews yet.',
  'reviews.beFirstReview': 'Be the first to write a review',
  'reviews.questions.empty': 'No questions yet.',
  'reviews.beFirstQuestion': 'Be the first to ask a question',
  'reviews.questions.answerLabel': 'Answer',
  'reviews.questions.awaitingAnswer': 'Awaiting an answer.',
  'reviews.questions.askedPrefix': 'Q: ',

  // Write review dialog
  'reviews.dialog.writeTitle': 'Write a review',
  'reviews.dialog.writeDescription':
    "Share your experience — reviews are published after moderation.",
  'reviews.dialog.askTitle': 'Ask a question',
  'reviews.dialog.askDescription': "We'll reply as soon as possible.",
  'reviews.dialog.signInRequired': 'Sign in required',
  'reviews.dialog.signInHint': 'Please sign in to leave a review.',
  'reviews.dialog.askSignInHint': 'Please sign in to ask a question.',
  'reviews.dialog.ratingLabel': 'Your rating',
  'reviews.dialog.reviewLabel': 'Your review',
  'reviews.dialog.reviewPlaceholder': 'What did you like or dislike about this product?',
  'reviews.dialog.questionLabel': 'Your question',
  'reviews.dialog.questionPlaceholder': 'Type your question here...',
  'reviews.dialog.ratingRequired': 'Please select a rating',
  'reviews.dialog.textRequired': 'Please write a review',
  'reviews.dialog.questionRequired': 'Please type your question',
  'reviews.dialog.alreadyReviewed': 'You already reviewed this product',
  'reviews.dialog.submitted': 'Submitted!',
  'reviews.dialog.submittedDesc': 'Your review is pending approval.',
  'reviews.dialog.questionSubmittedDesc': 'Your question is pending approval.',
  'reviews.dialog.submit': 'Submit',
  'reviews.dialog.submitting': 'Submitting…',
  'reviews.dialog.somethingWrong': 'Something went wrong',

  // Cart sheet
  'cart.title': 'Your Cart ({count})',
  'cart.close': 'Close cart',
  'cart.empty': 'Your cart is empty.',
  'cart.subtotal': 'Subtotal',
  'cart.checkout': 'Checkout',
  'cart.viewFullCart': 'View full cart',
  'cart.remove': 'Remove',
  'cart.sizePrefix': 'Size',

  // Checkout
  'checkout.title': 'Checkout',
  'checkout.signInTitle': 'Sign in to check out',
  'checkout.signInSubtitle': 'You need an account so your order can be tracked.',
  'checkout.emptyCart': 'Your cart is empty',
  'checkout.continueShopping': 'Continue shopping',
  'checkout.shippingDetails': 'Shipping details',
  'checkout.fullName': 'Full name',
  'checkout.streetAddress': 'Street address',
  'checkout.city': 'City',
  'checkout.zip': 'ZIP',
  'checkout.country': 'Country',
  'checkout.paymentHint': 'Payment details are collected by Stripe on the next page.',
  'checkout.orderSummary': 'Order summary',
  'checkout.qtyShort': 'Qty',
  'checkout.taxesShipping': 'Taxes & shipping',
  'checkout.calculatedAtStripe': 'Calculated at Stripe',
  'checkout.continueToPayment': 'Continue to payment',
  'checkout.redirecting': 'Redirecting…',

  // Order confirmation
  'orderConfirmation.title': 'Thank you for your order!',
  'orderConfirmation.emailConfirmation': 'A confirmation was sent to {email}.',
  'orderConfirmation.defaultEmail': 'your email',
  'orderConfirmation.orderLine': 'Order #{id} · ',
  'orderConfirmation.items': 'Items',
  'orderConfirmation.shipping': 'Shipping',
  'orderConfirmation.discount': 'Discount',
  'orderConfirmation.total': 'Total',
  'orderConfirmation.continueShopping': 'Continue shopping',
  'orderConfirmation.stillProcessing.title': "We're still processing your order",
  'orderConfirmation.stillProcessing.subtitle':
    "This usually takes a few seconds. Please refresh in a moment — you'll also receive a confirmation email.",
  'orderConfirmation.orderIdLabel': 'Order ID: {id}',

  // Order history
  'orderHistory.empty': "You haven't placed any orders yet.",
  'orderHistory.signInHint': 'Sign in to view your orders.',
  'orderHistory.orderPrefix': 'Order #',
  'orderHistory.itemsCount': '{count} items',

  // Wishlist
  'wishlist.savePrompt': 'Sign in to save items',
  'wishlist.saved': 'Saved to wishlist',
  'wishlist.removed': 'Removed from wishlist',
  'wishlist.failed': 'Something went wrong',
  'wishlist.aria.save': 'Save to wishlist',
  'wishlist.aria.remove': 'Remove from wishlist',

  // Script settings page
  'settings.title': 'Script Settings',
  'settings.subtitle': 'Site-level configuration for your Caspian Store installation.',
  'settings.sections.brand': 'Brand',
  'settings.brandName': 'Brand name',
  'settings.brandDescription': 'Brand description',
  'settings.sections.localization': 'Localization',
  'settings.defaultCurrency': 'Default currency (ISO 4217)',
  'settings.defaultLocale': 'Default locale',
  'settings.sections.payments': 'Payments',
  'settings.stripePublicKey': 'Stripe publishable key (pk_...)',
  'settings.sections.theme': 'Theme',
  'settings.theme.presets': 'Presets',
  'settings.theme.primary': 'Primary color',
  'settings.theme.primaryForeground': 'Primary foreground',
  'settings.theme.accent': 'Accent',
  'settings.theme.radius': 'Corner radius',
  'settings.sections.features': 'Features',
  'settings.saveButton': 'Save settings',
  'settings.saving': 'Saving…',
  'settings.needAdminRole': 'You need admin role to access script settings.',
  'settings.sections.fonts': 'Fonts',
  'settings.fonts.body': 'Body font stack',
  'settings.fonts.headline': 'Headline font stack',
  'settings.fonts.googleFamilies': 'Google Fonts families (comma-separated)',
  'settings.fonts.hint':
    'Each entry should match a Google Fonts `family=` spec, e.g. `Montserrat:wght@400;700`.',
  'settings.sections.hero': 'Homepage hero',
  'settings.hero.title': 'Title',
  'settings.hero.subtitle': 'Subtitle',
  'settings.hero.cta': 'CTA button label',
  'settings.hero.ctaHref': 'CTA link target',
  'settings.hero.imageUrl': 'Background image URL',

  // --- Forward-looking keys for v1.2+ surfaces ---

  // Homepage
  'home.featured.label': 'Curation',
  'home.featured.title': 'Featured Categories',
  'home.trending.label': 'Bestsellers',
  'home.trending.title': 'Trending Now',
  'home.newsletter.title': 'Join the circle',
  'home.newsletter.description': 'Early access to drops and editorial stories.',
  'home.newsletter.placeholder': 'Email address',
  'home.newsletter.submit': 'Subscribe',
  'home.newsletter.alreadySubscribed': 'This email is already on our list.',
  'home.newsletter.success': 'Subscribed!',
  'home.newsletter.successDesc': 'Thank you for subscribing.',
  'home.newsletter.failure': 'Failed to subscribe. Please try again.',

  // Journal
  'journal.title': 'The Journal',
  'journal.subtitle': 'Stories, style guides, and insights.',
  'journal.readMore': 'Read more',
  'journal.backToList': 'Back to the journal',

  // FAQs
  'faqs.title': 'Frequently Asked Questions',
  'faqs.subtitle': 'Find answers to common questions.',
  'faqs.empty': 'No FAQs yet.',

  // Generic content pages
  'page.notFound': 'Page not found.',
  'page.defaultContentHint': 'Administrators can edit this page in /admin/pages.',

  // Size guide
  'sizeGuide.title': 'Size Guide',
  'sizeGuide.subtitle': 'Find your perfect fit.',

  // Shipping & Returns
  'shipping.title': 'Shipping & Returns',
  'shipping.subtitle': 'Everything you need to know about getting your order.',
  'shipping.methods.title': 'Shipping Methods',
};

/**
 * Expands simple `{placeholder}` substitutions and a minimal ICU-plural subset:
 *   `{count, plural, =0 {none} one {one item} other {# items}}`
 *
 * - Exact-match arms (`=N`) are tried first.
 * - Otherwise, `count === 1` → `one`, else → `other`.
 * - `#` inside a plural arm is replaced with the numeric value.
 *
 * Other placeholders (non-plural) collapse to the provided value or stay as `{key}`.
 */
export function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;

  const pluralRegex = /\{(\w+),\s*plural,\s*([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  let result = template.replace(pluralRegex, (_: string, key: string, body: string) => {
    const rawValue = values[key];
    const count = typeof rawValue === 'number' ? rawValue : Number(rawValue);
    if (Number.isNaN(count)) return `{${key}}`;

    const armRegex = /(=\d+|zero|one|two|few|many|other)\s*\{([^{}]*)\}/g;
    const arms: Record<string, string> = {};
    let match: RegExpExecArray | null;
    while ((match = armRegex.exec(body)) !== null) {
      arms[match[1]] = match[2];
    }

    const exactKey = `=${count}`;
    const chosen =
      arms[exactKey] ?? (count === 1 ? arms.one ?? arms.other : arms.other ?? arms.one) ?? '';
    return chosen.replace(/#/g, String(count));
  });

  result = result.replace(/\{(\w+)\}/g, (_: string, key: string) => {
    const v = values[key];
    return v !== undefined ? String(v) : `{${key}}`;
  });

  return result;
}

const RTL_LOCALES = new Set(['ar', 'he', 'fa', 'ur']);

/** Returns true for right-to-left locales (ar, he, fa, ur). Matches the primary subtag only. */
export function isRtl(locale: string): boolean {
  const primary = locale.split('-')[0].toLowerCase();
  return RTL_LOCALES.has(primary);
}
