import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

const usersCollection = collection(db, 'users');

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  usernameLower: string;
}

export async function findUserByUsername(username: string): Promise<UserProfile | null> {
  const normalized = username.trim().toLowerCase();
  if (!normalized) return null;

  const q = query(usersCollection, where('usernameLower', '==', normalized));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }

  const docSnapshot = snapshot.docs[0];
  return docSnapshot.data() as UserProfile;
}

export async function createUserProfile({
  uid,
  email,
  displayName,
  username,
}: {
  uid: string;
  email: string;
  displayName: string;
  username: string;
}) {
  const normalized = username.trim();
  await setDoc(doc(usersCollection, uid), {
    uid,
    email,
    displayName,
    username: normalized,
    usernameLower: normalized.toLowerCase(),
    createdAt: serverTimestamp(),
  });
}


