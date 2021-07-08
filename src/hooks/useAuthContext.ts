import { createContext, useContext } from "react";
import type { ValidCredentials } from "./useStoredCredentials/useStoredCredentials";

export const AuthContext = createContext<ValidCredentials | undefined>(
  undefined
);

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw Error("You cannot use useAuthContext outside a AuthContext.Provider");
  }

  return context;
}
