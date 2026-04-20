/**
 * Firestore security rules for a Caspian Store installation.
 *
 * Consumers should write this to their `firestore.rules` file and deploy with
 * `firebase deploy --only firestore:rules`. Alternatively, consumers can merge
 * their existing rules with these.
 */
export const CASPIAN_FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null
          && exists(/databases/$(database)/documents/users/$(request.auth.uid))
          && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function isAuth() {
      return request.auth != null;
    }

    match /products/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /productCategories/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /productBrands/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /productCollections/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /orders/{id} {
      allow read: if isAdmin() || (isAuth() && resource.data.userId == request.auth.uid);
      allow create: if isAuth();
      allow update: if isAdmin();
    }

    match /users/{uid} {
      allow read: if isAuth() && request.auth.uid == uid;
      allow write: if isAuth() && request.auth.uid == uid
                   && (!('role' in request.resource.data) || request.resource.data.role == resource.data.role);
      allow read, write: if isAdmin();
    }

    match /carts/{uid} {
      allow read, write: if isAuth() && request.auth.uid == uid;
    }

    match /reviews/{id} {
      allow read: if resource.data.status == 'approved' || isAdmin();
      allow create: if isAuth()
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.status == 'pending'
        && request.resource.data.rating is number
        && request.resource.data.rating >= 1
        && request.resource.data.rating <= 5;
      allow update, delete: if isAdmin();
    }

    match /questions/{id} {
      allow read: if resource.data.status == 'approved' || isAdmin();
      allow create: if isAuth()
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.status == 'pending';
      allow update, delete: if isAdmin();
    }

    match /promoCodes/{id} {
      allow read: if isAuth();
      allow write: if isAdmin();
    }

    match /shippingMethods/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /faqs/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /journal/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /pageContents/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /languages/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /subscribers/{id} {
      allow create: if true;
      allow read, delete: if isAdmin();
    }

    match /settings/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Script-level site configuration (theme, feature flags, etc.)
    match /scriptSettings/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
`;
