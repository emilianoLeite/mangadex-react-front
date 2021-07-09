import { useState } from "react";

// TODO: find a way to coaslesce with src/lib/mangadex/client.ts credentials management
interface NewCredentials {
  sessionToken: string;
  refreshToken: string;
}

interface StoredCredentials {
  sessionToken: string | null;
  refreshToken: string | null;
  sessionTokenTTL: string | null;
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
    sessionTokenTTL: window.localStorage.getItem("session-token-ttl"),
  });

  function storeCredentials({
    sessionToken: newSession,
    refreshToken: newRefresh,
  }: NewCredentials) {
    window.localStorage.setItem(sessionTokenKey, newSession);
    window.localStorage.setItem(refreshTokenKey, newRefresh);
    window.localStorage.setItem(
      "session-token-ttl",
      `${new Date().getTime() * 1000 * 60 * 60}`
    );
    setCredentials({
      sessionToken: newSession,
      refreshToken: newRefresh,
      sessionTokenTTL: `${new Date().getTime() * 1000 * 60 * 60}`,
    });
  }

  return {
    credentials,
    storeCredentials,
    areCredentialsValid,
  };
}
