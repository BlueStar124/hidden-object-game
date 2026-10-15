import { createContext, useContext } from 'react';

interface AuthContextValue {
  email: string;
  signOut: () => Promise<void>;
  openAccount: () => void;
}

const AuthContext = createContext<AuthContextValue>({ email: '', signOut: async () => {}, openAccount: () => {} });

export const AuthContextProvider = AuthContext.Provider;

/** The active account details exposed to the protected game screen. */
export const useAuth = (): AuthContextValue => useContext(AuthContext);
