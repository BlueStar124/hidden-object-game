import { createContext, useContext } from 'react';

interface AuthContextValue {
  userId: string | null;
  email: string;
  /** The player's name in the game (core/profile), null when signed out or not chosen yet */
  name: string | null;
  signOut: () => Promise<void>;
  openAccount: () => void;
  /** Opens the dialog to change the name in the game */
  editName: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  userId: null,
  email: '',
  name: null,
  signOut: async () => {},
  openAccount: () => {},
  editName: () => {},
});

export const AuthContextProvider = AuthContext.Provider;

/** The active account details exposed to the protected game screen. */
export const useAuth = (): AuthContextValue => useContext(AuthContext);
