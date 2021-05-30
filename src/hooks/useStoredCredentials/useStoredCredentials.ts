export function useStoredCredentials() {
  const sessionToken = window.localStorage.getItem("session-token");
  const refreshToken = window.localStorage.getItem("refresh-token");
  return {
    credentials: {
      sessionToken: sessionToken,
      refreshToken: refreshToken,
    },
  };
}
