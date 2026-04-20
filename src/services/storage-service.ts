import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
  type FirebaseStorage,
} from 'firebase/storage';
import { doc, updateDoc, Timestamp, type Firestore } from 'firebase/firestore';
import { updateProfile, type Auth } from 'firebase/auth';

const PROFILE_PHOTO_PATH = (uid: string, ext: string) => `users/${uid}/avatar.${ext}`;
const LEGACY_PROFILE_PHOTO_PATHS = ['jpg', 'jpeg', 'png', 'webp'];

export const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_PROFILE_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function extFromType(type: string): string {
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
}

export interface UploadProfilePhotoInput {
  storage: FirebaseStorage;
  db: Firestore;
  auth: Auth;
  uid: string;
  file: File;
}

export async function uploadProfilePhoto({
  storage,
  db,
  auth,
  uid,
  file,
}: UploadProfilePhotoInput): Promise<string> {
  if (!ALLOWED_PROFILE_PHOTO_TYPES.includes(file.type)) {
    throw new Error('Please select a JPEG, PNG, or WebP image.');
  }
  if (file.size > MAX_PROFILE_PHOTO_BYTES) {
    throw new Error(`Image must be under ${MAX_PROFILE_PHOTO_BYTES / 1024 / 1024} MB.`);
  }

  const ext = extFromType(file.type);
  const path = PROFILE_PHOTO_PATH(uid, ext);
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);

  await updateDoc(doc(db, 'users', uid), { photoURL: url, updatedAt: Timestamp.now() });
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { photoURL: url });
  }
  return url;
}

export async function removeProfilePhoto({
  storage,
  db,
  auth,
  uid,
}: Omit<UploadProfilePhotoInput, 'file'>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { photoURL: null, updatedAt: Timestamp.now() });
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { photoURL: null });
  }
  // Best-effort cleanup of any of the allowed extensions.
  for (const ext of LEGACY_PROFILE_PHOTO_PATHS) {
    try {
      await deleteObject(ref(storage, PROFILE_PHOTO_PATH(uid, ext)));
    } catch {
      /* ignore missing objects */
    }
  }
}
