/**
 * Default English strings. Consumers can override individual keys via
 * <CaspianStoreProvider messages={{ ... }}>, or ship a completely different
 * locale by providing a full dictionary.
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
};

/** Interpolates `{placeholders}` with the provided values. */
export function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = values[key];
    return v !== undefined ? String(v) : `{${key}}`;
  });
}
