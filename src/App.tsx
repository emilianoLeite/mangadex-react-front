import { QueryClient, QueryClientProvider } from "react-query";
import { LoginPage } from "./pages/public/LoginPage";
import { useStoredCredentials } from "./hooks/useStoredCredentials/useStoredCredentials";
import { AuthContext } from "./hooks/useAuthContext";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { HomePage } from "./pages/private/HomePage";
import { PrivateRoutes } from "./pages/private/PrivateRoutes";

const queryClient = new QueryClient();

export function App() {
  const { credentials, storeCredentials, areCredentialsValid } =
    useStoredCredentials();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Switch>
          {areCredentialsValid(credentials) ? (
            <PrivateRoutes>
              <AuthContext.Provider value={credentials}>
                <Route exact path="/">
                  <HomePage />
                </Route>
              </AuthContext.Provider>
            </PrivateRoutes>
          ) : (
            <Route exact path="/">
              <LoginPage onLogin={storeCredentials} />
            </Route>
          )}
        </Switch>
      </Router>
    </QueryClientProvider>
  );
}
