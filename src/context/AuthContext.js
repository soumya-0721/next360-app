import React, { createContext, useContext, useState, useEffect } from 'react';
import { getData, setData } from '../utils/storage';
import { DEFAULT_USERS } from '../utils/data';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let users = await getData('users', null);
      if (!users) {
        await setData('users', DEFAULT_USERS);
        users = DEFAULT_USERS;
      }
      const session = await getData('session', null);
      if (session) {
        const valid = users.find(u => u.email === session.email && u.password === session.password);
        if (valid) setUser(valid);
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email, password) => {
    const users = await getData('users', DEFAULT_USERS);
    const found = users.find(u => u.email === email.toLowerCase().trim() && u.password === password.trim());
    if (!found) throw new Error('Invalid email or password');
    await setData('session', found);
    setUser(found);
    return found;
  };

  const logout = async () => {
    await setData('session', null);
    setUser(null);
  };

  const canSeeAll = () => user && (user.role === 'CEO' || user.role === 'CTO');
  const isCEO = () => user && user.role === 'CEO';

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, canSeeAll, isCEO }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
