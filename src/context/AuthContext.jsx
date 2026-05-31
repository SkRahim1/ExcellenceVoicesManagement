import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { mockDb } from '../services/mockDb';

const AuthContext = createContext(null);

// Static map to assign permissions based on their authenticated email address
const ROLE_MAP = {
  'partner1@excellencevoices.com': 'Partner 1',
  'manager@excellencevoices.com': 'Manager',
  'raviteja@excellencevoices.in': 'Manager',
  'rana@excellencevoice.in': 'Partner 2',
  'rahim@excellencevoices.in': 'Partner 3',
  'rahim@excellencevoicesvoices.in': 'Partner 3'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch startup updates from Google Sheet
    mockDb.syncData().catch(e => console.error('Startup sync failed', e));

    // 2. Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Assign the role based on email, defaulting to read-only if not in the map
        const role = ROLE_MAP[firebaseUser.email.toLowerCase()] || 'Read-Only Partner';
        
        const sessionData = {
          email: firebaseUser.email,
          role: role,
          uid: firebaseUser.uid
        };
        
        // Save user to session to help services track log actions
        sessionStorage.setItem('evm_user', JSON.stringify(sessionData));
        setUser(sessionData);
      } else {
        sessionStorage.removeItem('evm_user');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Start background sync polling every 30 seconds to fetch partner updates
    const interval = setInterval(async () => {
      try {
        await mockDb.syncData();
      } catch (err) {
        console.error('Background sync polling failed:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      // Map Firebase auth errors to readable messages
      let errorMsg = 'Invalid email or password';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMsg = 'Invalid email or password';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMsg = 'Too many failed login attempts. Please try again later.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error('Firebase sign out failed:', e);
    }
  };

  // Helper check: Only Partner 1 and Manager have Edit capabilities.
  const hasEditPermission = user ? (user.role === 'Partner 1' || user.role === 'Manager') : false;

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasEditPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

