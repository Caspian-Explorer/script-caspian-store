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
  'checkout.paymentHint': 'Payment details are collected by {provider} on the next page.',
  'checkout.orderSummary': 'Order summary',
  'checkout.qtyShort': 'Qty',
  'checkout.continueToPayment': 'Continue to payment',
  'checkout.redirecting': 'Redirecting…',
  'checkout.shippingLine': 'Shipping',
  'checkout.totalLine': 'Total',
  'checkout.rate.heading': 'Shipping method',
  'checkout.rate.selectLabel': 'Shipping method',
  'checkout.rate.free': 'Free',
  'checkout.rate.daysSuffix': 'business days',
  'checkout.rate.noRatesAvailable': 'No shipping available for this cart. Contact the store if this looks wrong.',
  'checkout.rate.notSelected': '—',
  'checkout.noPaymentConfigured.title': 'Checkout is not available',
  'checkout.noPaymentConfigured.body':
    "The store owner hasn't set up a payment provider yet. Please check back soon.",
  'checkout.noPaymentConfigured.adminLink': 'Set up payments',

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
  'settings.sections.theme': 'Theme',
  'settings.theme.presets': 'Presets',
  'settings.theme.primary': 'Primary color',
  'settings.theme.primaryForeground': 'Primary foreground',
  'settings.theme.accent': 'Accent',
  'settings.theme.radius': 'Corner radius',
  // Admin — payment plugins
  'admin.paymentPlugins.title': 'Payments',
  'admin.paymentPlugins.subtitle':
    'Install and configure payment providers. Only enabled providers can process checkouts.',
  'admin.paymentPlugins.browse': 'Browse providers',
  'admin.paymentPlugins.browseTitle': 'Available payment providers',
  'admin.paymentPlugins.browseSubtitle':
    'Pick a provider to install. You can edit configuration after installing.',
  'admin.paymentPlugins.install': 'Install',
  'admin.paymentPlugins.empty':
    'No payment providers installed yet. Install one to enable checkout.',
  'admin.paymentPlugins.confirmRemove': 'Remove this payment provider install?',
  'admin.paymentPlugins.installTitle': 'Install payment provider',
  'admin.paymentPlugins.configureTitle': 'Configure payment provider',
  'admin.paymentPlugins.col.order': 'Order',
  'admin.paymentPlugins.col.name': 'Name',
  'admin.paymentPlugins.col.plugin': 'Provider',
  'admin.paymentPlugins.col.status': 'Status',
  'admin.paymentPlugins.col.actions': 'Actions',
  'admin.paymentPlugins.status.enabled': 'Enabled',
  'admin.paymentPlugins.status.disabled': 'Disabled',
  'admin.paymentPlugins.action.enable': 'Enable',
  'admin.paymentPlugins.action.disable': 'Disable',
  'admin.paymentPlugins.action.configure': 'Configure',
  'admin.paymentPlugins.action.remove': 'Remove',
  'admin.paymentPlugins.field.name': 'Display name',
  'admin.paymentPlugins.field.nameHint':
    'Label shown in admin — e.g. "Stripe — Production" or "Stripe — Test".',
  'admin.paymentPlugins.field.order': 'Order',
  'admin.paymentPlugins.field.stripe.publishableKey': 'Publishable key',
  'admin.paymentPlugins.field.stripe.publishableKeyHint':
    'The `pk_live_...` or `pk_test_...` key from your Stripe dashboard. Secret keys live in Cloud Functions secrets, not here.',
  'admin.paymentPlugins.toasts.installed': 'Provider installed',
  'admin.paymentPlugins.toasts.updated': 'Provider updated',
  'admin.paymentPlugins.toasts.removed': 'Provider removed',
  'admin.paymentPlugins.errors.nameRequired': 'Display name is required',
  'admin.paymentPlugins.errors.invalidConfig': 'Invalid configuration',
  'admin.paymentPlugins.errors.saveFailed': 'Save failed',
  'admin.paymentPlugins.errors.removeFailed': 'Remove failed',
  'admin.paymentPlugins.errors.toggleFailed': 'Toggle failed',

  'admin.appearance.title': 'Appearance',
  'admin.appearance.subtitle': 'Pick a preset or fine-tune the storefront theme tokens.',
  'admin.appearance.gridSubtitle':
    'Browse themes, preview with dummy data, then activate to push to your storefront.',
  'admin.appearance.customize': 'Customize',
  'admin.appearance.saved': 'Theme saved',
  'admin.appearance.saveFailed': 'Failed to save theme',
  'admin.appearance.activated': 'Activated "{name}"',
  'admin.appearance.categories': 'Categories',
  'admin.appearance.searchPlaceholder': 'Search themes',
  'admin.appearance.noResults': 'No themes match that filter.',
  'admin.appearance.previewButton': 'Preview',
  'admin.appearance.activateButton': 'Activate',
  'admin.appearance.activating': 'Activating…',
  'admin.appearance.activeButton': 'Active',
  'admin.appearance.badgeNew': 'New',
  'admin.appearance.badgeActive': 'Active',
  'admin.appearance.preview.badge': 'Preview',
  'admin.appearance.preview.previewing': 'Previewing "{name}" — dummy data, not your live store',
  'admin.appearance.preview.apply': 'Apply theme',
  'admin.appearance.preview.applying': 'Applying…',
  'admin.appearance.preview.applied': 'Applied ✓',
  'admin.appearance.preview.close': 'Close',
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
  'shipping.methods.empty': 'No shipping methods configured yet.',
  'shipping.methods.daysSuffix': 'business days',
  'shipping.methods.col.method': 'Method',
  'shipping.methods.col.delivery': 'Estimated delivery',
  'shipping.methods.col.cost': 'Cost',

  // Shipping plugin catalog (shown in admin Browse dialog + public page)
  'shipping.plugins.flat-rate.name': 'Flat Rate',
  'shipping.plugins.flat-rate.description': 'Charge a fixed price on every order.',
  'shipping.plugins.free-shipping.name': 'Free Shipping',
  'shipping.plugins.free-shipping.description':
    'Offer shipping at no cost — useful for gifts, digital goods, or promotional periods.',
  'shipping.plugins.free-over-threshold.name': 'Free Over Threshold',
  'shipping.plugins.free-over-threshold.description':
    'Free shipping on orders above a subtotal threshold; a fallback rate otherwise.',
  'shipping.plugins.weight-based.name': 'Weight-Based',
  'shipping.plugins.weight-based.description':
    'Charge a base rate plus a per-kilogram surcharge. Requires each product to have a weight.',

  // Admin — Shipping plugins page
  'admin.shippingPlugins.title': 'Shipping plugins',
  'admin.shippingPlugins.subtitle':
    'Install shipping calculators and configure the rates shown at checkout.',
  'admin.shippingPlugins.browse': '+ Browse plugins',
  'admin.shippingPlugins.browseTitle': 'Available shipping plugins',
  'admin.shippingPlugins.browseSubtitle':
    'Pick a plugin to install. You can install more than one — each install shows up as a separate option at checkout.',
  'admin.shippingPlugins.install': 'Install',
  'admin.shippingPlugins.installTitle': 'Install shipping plugin',
  'admin.shippingPlugins.configureTitle': 'Configure shipping plugin',
  'admin.shippingPlugins.empty': 'No shipping plugins installed yet.',
  'admin.shippingPlugins.daysSuffix': 'days',
  'admin.shippingPlugins.confirmRemove': 'Remove this shipping plugin install?',
  'admin.shippingPlugins.col.order': 'Order',
  'admin.shippingPlugins.col.name': 'Name',
  'admin.shippingPlugins.col.plugin': 'Plugin',
  'admin.shippingPlugins.col.delivery': 'Delivery',
  'admin.shippingPlugins.col.status': 'Status',
  'admin.shippingPlugins.col.actions': 'Actions',
  'admin.shippingPlugins.status.enabled': 'Enabled',
  'admin.shippingPlugins.status.disabled': 'Disabled',
  'admin.shippingPlugins.action.enable': 'Enable',
  'admin.shippingPlugins.action.disable': 'Disable',
  'admin.shippingPlugins.action.configure': 'Configure',
  'admin.shippingPlugins.action.remove': 'Remove',
  'admin.shippingPlugins.field.name': 'Display name',
  'admin.shippingPlugins.field.nameHint':
    'Shown to shoppers at checkout and on the public Shipping page.',
  'admin.shippingPlugins.field.minDays': 'Min days',
  'admin.shippingPlugins.field.maxDays': 'Max days',
  'admin.shippingPlugins.field.order': 'Order',
  'admin.shippingPlugins.field.flatRate.price': 'Price',
  'admin.shippingPlugins.field.freeShipping.hint':
    'Free Shipping needs no configuration — it always returns a rate of 0.',
  'admin.shippingPlugins.field.freeOverThreshold.threshold': 'Free when subtotal ≥',
  'admin.shippingPlugins.field.freeOverThreshold.fallbackPrice': 'Otherwise charge',
  'admin.shippingPlugins.field.weightBased.basePrice': 'Base price',
  'admin.shippingPlugins.field.weightBased.pricePerKg': 'Price per kg',
  'admin.shippingPlugins.field.weightBased.hint':
    'Only offered at checkout when at least one cart item has a weight set (see product editor → Weight).',
  'admin.shippingPlugins.toasts.installed': 'Shipping plugin installed',
  'admin.shippingPlugins.toasts.updated': 'Shipping plugin updated',
  'admin.shippingPlugins.toasts.removed': 'Shipping plugin removed',
  'admin.shippingPlugins.errors.nameRequired': 'Display name is required',
  'admin.shippingPlugins.errors.invalidConfig': 'Invalid plugin configuration',
  'admin.shippingPlugins.errors.saveFailed': 'Save failed',
  'admin.shippingPlugins.errors.removeFailed': 'Remove failed',
  'admin.shippingPlugins.errors.toggleFailed': 'Action failed',

  // Site shell — header
  'navigation.brand': 'STORE',
  'navigation.shop': 'Shop',
  'navigation.collections': 'Collections',
  'navigation.pages': 'Pages',
  'navigation.searchPlaceholder': 'Search…',
  'navigation.signIn': 'Sign in',
  'navigation.openCart': 'Open cart',
  'navigation.wishlist': 'Wishlist',
  'navigation.myAccount': 'My account',
  'navigation.admin': 'Admin',

  // Site shell — footer
  'footer.about.title': 'About',
  'footer.customerCare.title': 'Customer care',
  'footer.newsletter.title': 'Newsletter',
  'footer.newsletter.description': 'Be the first to hear about new arrivals.',
  'footer.newsletter.placeholder': 'you@example.com',
  'footer.newsletter.success': 'Subscribed!',
  'footer.newsletter.alreadySubscribed': 'Already subscribed',
  'footer.newsletter.error': 'Subscribe failed',

  // Setup wizard
  'setup.back': 'Go Back',
  'setup.next': 'Next Step',
  'setup.saving': 'Saving…',

  'setup.steps.siteInfo': 'YOUR INFO',
  'setup.steps.branding': 'BRANDING',
  'setup.steps.features': 'ADD-ONS',
  'setup.steps.summary': 'SUMMARY',

  'setup.errors.brandNameRequired': 'Brand name is required',
  'setup.errors.contactEmailInvalid': 'Invalid email',
  'setup.errors.saveFailed': 'Could not save — check your connection and try again.',

  // Setup — Site info
  'setup.siteInfo.heading': 'Tell us about your store',
  'setup.siteInfo.subhead': 'Your brand name and contact info. You can change any of this later in the admin panel.',
  'setup.siteInfo.brandName': 'Brand name',
  'setup.siteInfo.brandDescription': 'Short description',
  'setup.siteInfo.brandDescriptionHint': 'e.g. Thoughtfully-made essentials',
  'setup.siteInfo.contactEmail': 'Contact email',
  'setup.siteInfo.currency': 'Currency',
  'setup.siteInfo.currencyHint': 'Three-letter ISO 4217 code (USD, EUR, GBP).',

  // Setup — Branding
  'setup.branding.heading': 'Pick a look',
  'setup.branding.subhead': 'Choose a theme preset and set your homepage hero. You can customize further in Settings.',
  'setup.branding.themePreset': 'Theme preset',
  'setup.branding.heroTitle': 'Hero title',
  'setup.branding.heroTitlePlaceholder': 'Shop our latest collection',
  'setup.branding.heroSubtitle': 'Hero subtitle',
  'setup.branding.heroSubtitlePlaceholder': 'Curated essentials delivered to your door.',
  'setup.branding.heroCta': 'Hero button label',

  // Setup — Features
  'setup.features.heading': 'Turn on what you need',
  'setup.features.subhead': 'Every feature is on by default. Turn off anything you don’t want.',
  'setup.features.reviews.title': 'Reviews',
  'setup.features.reviews.desc': 'Let shoppers rate products.',
  'setup.features.questions.title': 'Q&A',
  'setup.features.questions.desc': 'Let shoppers ask questions on a product page.',
  'setup.features.wishlist.title': 'Wishlist',
  'setup.features.wishlist.desc': 'Save-for-later on every product card.',
  'setup.features.promoCodes.title': 'Promo codes',
  'setup.features.promoCodes.desc': 'Create discount codes in admin.',
  'setup.features.guestCheckout.title': 'Guest checkout',
  'setup.features.guestCheckout.desc': 'Let non-signed-in shoppers buy.',
  'setup.features.multiLanguage.title': 'Multi-language',
  'setup.features.multiLanguage.desc': 'Serve the store in more than one language.',

  // Setup — Summary
  'setup.summary.heading': 'Ready to open for business',
  'setup.summary.subhead': 'Review your settings. You can edit anything from the admin panel afterwards.',
  'setup.summary.brand': 'Brand',
  'setup.summary.contactEmail': 'Contact email',
  'setup.summary.currency': 'Currency',
  'setup.summary.theme': 'Theme',
  'setup.summary.themeCustom': 'Custom',
  'setup.summary.hero': 'Hero title',
  'setup.summary.features': 'Features',
  'setup.summary.noFeatures': 'None enabled',
  'setup.summary.confirm': 'Open my store',

  // Setup — Init (dev-only Firebase paste)
  'setup.init.heading': 'Connect your Firebase project',
  'setup.init.subhead': 'Paste the web-app config from Firebase Console → Project settings → Your apps. We’ll write it to .env.local so your dev server can pick it up.',
  'setup.init.devOnlyTitle': 'Development only.',
  'setup.init.devOnlyBody': 'This form works only when running npm run dev. In production, set env vars on your host (Vercel, App Hosting).',
  'setup.init.fields.apiKey': 'NEXT_PUBLIC_FIREBASE_API_KEY',
  'setup.init.fields.authDomain': 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'setup.init.fields.projectId': 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'setup.init.fields.storageBucket': 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'setup.init.fields.messagingSenderId': 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'setup.init.fields.appId': 'NEXT_PUBLIC_FIREBASE_APP_ID',
  'setup.init.submit': 'Write .env.local',
  'setup.init.submitting': 'Writing…',
  'setup.init.errorMissing': 'All fields are required.',
  'setup.init.errorGeneric': 'Could not write .env.local. Check the dev server logs.',
  'setup.init.successTitle': 'Saved to .env.local',
  'setup.init.successBody': 'Stop the dev server (Ctrl+C), run npm run dev again, then go to /auth/register to create the first admin account.',
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
