import { doc, getDoc, updateDoc, Timestamp, type Firestore } from 'firebase/firestore';
import type { UserAddress, UserProfile } from '../types';

export async function updateDisplayName(
  db: Firestore,
  uid: string,
  displayName: string,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    displayName,
    updatedAt: Timestamp.now(),
  });
}

async function readAddresses(db: Firestore, uid: string): Promise<UserAddress[]> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return [];
  const data = snap.data() as UserProfile;
  return data.addresses ?? [];
}

async function writeAddresses(
  db: Firestore,
  uid: string,
  addresses: UserAddress[],
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { addresses, updatedAt: Timestamp.now() });
}

function newAddressId() {
  return `addr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function addAddress(
  db: Firestore,
  uid: string,
  address: Omit<UserAddress, 'id'>,
): Promise<UserAddress> {
  const existing = await readAddresses(db, uid);
  let nextList = existing;
  if (address.isDefault) {
    nextList = existing.map((a) => ({ ...a, isDefault: false }));
  }
  const created: UserAddress = { ...address, id: newAddressId() };
  // If this is the first address, force it default for a better UX.
  if (existing.length === 0) created.isDefault = true;
  nextList = [...nextList, created];
  await writeAddresses(db, uid, nextList);
  return created;
}

export async function updateAddress(
  db: Firestore,
  uid: string,
  address: UserAddress,
): Promise<void> {
  const existing = await readAddresses(db, uid);
  const next = existing.map((a) => {
    if (a.id === address.id) return address;
    if (address.isDefault) return { ...a, isDefault: false };
    return a;
  });
  await writeAddresses(db, uid, next);
}

export async function deleteAddress(db: Firestore, uid: string, addressId: string): Promise<void> {
  const existing = await readAddresses(db, uid);
  const filtered = existing.filter((a) => a.id !== addressId);
  // If we removed the default, promote the first remaining address.
  if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
    filtered[0] = { ...filtered[0], isDefault: true };
  }
  await writeAddresses(db, uid, filtered);
}

export async function setDefaultAddress(
  db: Firestore,
  uid: string,
  addressId: string,
): Promise<void> {
  const existing = await readAddresses(db, uid);
  const next = existing.map((a) => ({ ...a, isDefault: a.id === addressId }));
  await writeAddresses(db, uid, next);
}
