import { createContext } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { LoginPage } from "./pages/public/LoginPage";
import { PrivatePages } from "./pages/private/PrivatePages";
import {
  StoredCredentials,
  useStoredCredentials,
} from "./hooks/useStoredCredentials/useStoredCredentials";

const queryClient = new QueryClient();
export const AuthContext = createContext<StoredCredentials>({
  refreshToken: null,
  sessionToken: null,
});

export function App() {
  const { credentials, storeCredentials, areCredentialsValid } =
    useStoredCredentials();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={credentials}>
        {areCredentialsValid ? (
          <PrivatePages />
        ) : (
          <LoginPage onLogin={storeCredentials} />
        )}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}
