import { useState } from "react";

interface NewCredentials {
  sessionToken: string;
  refreshToken: string;
}

interface StoredCredentials {
  sessionToken: string | null;
  refreshToken: string | null;
}

export type ValidCredentials = {
  [K in keyof StoredCredentials]: NonNullable<StoredCredentials[K]>;
};

const sessionTokenKey = "session-token";
const refreshTokenKey = "refresh-token";

function areCredentialsValid(
  credentials: StoredCredentials
): credentials is ValidCredentials {
  return !!credentials.refreshToken && !!credentials.sessionToken;
}

export function useStoredCredentials() {
  const [credentials, setCredentials] = useState<StoredCredentials>({
    sessionToken: window.localStorage.getItem(sessionTokenKey),
    refreshToken: window.localStorage.getItem(refreshTokenKey),
  });

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
