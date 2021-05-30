import { useState } from "react";

interface NewCredentials {
  sessionToken: string;
  refreshToken: string;
}

const sessionTokenKey = "session-token";
const refreshTokenKey = "refresh-token";

export function useStoredCredentials() {
  const [credentials, setCredentials] = useState({
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
  };
}
