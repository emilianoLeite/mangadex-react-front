import { createContext, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { LoginPage } from "./pages/public/LoginPage";
import { PrivatePages } from "./pages/private/PrivatePages";
import { UserTokens } from "./hooks/useLogin";

const queryClient = new QueryClient();
export const AuthContext = createContext<UserTokens | undefined>(undefined);

export function App() {
  // TODO useStoredCredentials
  const [tokens, setTokens] = useState<UserTokens>();

  useEffect(() => {
    console.log("tokens", tokens);
  }, [tokens]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={tokens}>
        {tokens ? <PrivatePages /> : <LoginPage onLogin={setTokens} />}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}
