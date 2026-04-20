import { arrayRemove, arrayUnion, doc, updateDoc, type Firestore } from 'firebase/firestore';

export async function addToWishlist(db: Firestore, uid: string, productId: string) {
  await updateDoc(doc(db, 'users', uid), { wishlist: arrayUnion(productId) });
}

export async function removeFromWishlist(db: Firestore, uid: string, productId: string) {
  await updateDoc(doc(db, 'users', uid), { wishlist: arrayRemove(productId) });
}
