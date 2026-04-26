import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { User } from 'firebase/auth/cordova';

export function useAuth() {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser: User) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { user, loading };
}