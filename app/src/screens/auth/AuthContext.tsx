import { createContext, useContext } from 'react';

interface AuthContextValue {
  email: string;
  /** The player's name in the game (core/profile), null when signed out or not chosen yet */
  name: string | null;
  signOut: () => Promise<void>;
  openAccount: () => void;
  /** Opens the dialog to change the name in the game */
  editName: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  email: '',
  name: null,
  signOut: async () => {},
  openAccount: () => {},
  editName: () => {},
});

export const AuthContextProvider = AuthContext.Provider;

/** The active account details exposed to the protected game screen. */
export const useAuth = (): AuthContextValue => useContext(AuthContext);
