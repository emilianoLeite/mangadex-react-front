import { useEffect, useState } from "react";

interface NewCredentials {
  sessionToken: string;
  refreshToken: string;
}

export interface StoredCredentials {
  sessionToken: string | null;
  refreshToken: string | null;
}

const sessionTokenKey = "session-token";
const refreshTokenKey = "refresh-token";

export function useStoredCredentials() {
  const [credentials, setCredentials] = useState<StoredCredentials>({
    sessionToken: window.localStorage.getItem(sessionTokenKey),
    refreshToken: window.localStorage.getItem(refreshTokenKey),
  });
  const [areCredentialsValid, setAreCredentialsValid] = useState(false);
  useEffect(() => {
    setAreCredentialsValid(
      !!credentials.refreshToken && !!credentials.sessionToken
    );
  }, [credentials]);

  function storeCredentials({
    sessionToken: newSession,
    refreshToken: newRefresh,
  }: NewCredentials) {
    window.localStorage.setItem(sessionTokenKey, newSession);
    window.localStorage.setItem(refreshTokenKey, newRefresh);
    setCredentials({ sessionToken: newSession, refreshToken: newRefresh });
  }

  return {
    credentials,
    storeCredentials,
    areCredentialsValid,
  };
}
