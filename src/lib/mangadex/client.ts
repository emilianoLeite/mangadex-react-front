import axios from "axios";
import type { RefreshTokenRequest, RefreshTokenResponse } from "./interfaces";

type SessionToken = string;

interface Credentials {
  sessionToken: string;
  sessionTTL: number;
  refreshToken: string;
}

const fifteenMinutesFromNow = 15 * 60 * 1000;
const sessionTokenTTLKey = "session-token-ttl";
const sessionTokenKey = "session-token";
const refreshTokenKey = "refresh-token";

// function followedMangaList() {
//   const currentSession = getFreshSessionToken();
// }

// function login() {
//   // login request
//   // salva localStorage
//   // salva na closure?
// }

function storeCredentials(credentials: Credentials) {
  window.localStorage.setItem(sessionTokenKey, credentials.sessionToken);
  window.localStorage.setItem(sessionTokenTTLKey, `${credentials.sessionTTL}`);
  window.localStorage.setItem(refreshTokenKey, credentials.refreshToken);
}

function clearStorage() {
  window.localStorage.removeItem(sessionTokenKey);
  window.localStorage.removeItem(sessionTokenTTLKey);
  window.localStorage.removeItem(refreshTokenKey);
}

function ensureCredentialsArePersisted() {
  const rawSessionTTL = window.localStorage.getItem(sessionTokenTTLKey);
  const sessionToken = window.localStorage.getItem(sessionTokenKey);
  const refreshToken = window.localStorage.getItem(refreshTokenKey);

  if (sessionToken && rawSessionTTL && refreshToken) {
    const sessionTTL = parseInt(rawSessionTTL, 10);

    return {
      sessionToken,
      sessionTTL,
      refreshToken,
    };
  } else {
    throw new Error("stored tokens not found");
  }
}

async function refreshCredentials(refreshToken: string): Promise<Credentials> {
  const requestParams: RefreshTokenRequest = { token: refreshToken };

  const {
    data: { token },
  } = await axios.post<RefreshTokenResponse>("/auth/refresh", requestParams);

  return {
    refreshToken: token.refresh,
    sessionToken: token.session,
    sessionTTL: new Date().getTime() + fifteenMinutesFromNow,
  };
}

export async function getFreshSessionToken(): Promise<SessionToken> {
  const { sessionToken, sessionTTL, refreshToken } =
    ensureCredentialsArePersisted();

  if (new Date().getTime() < sessionTTL) {
    return sessionToken;
  } else {
    try {
      const newCredentials = await refreshCredentials(refreshToken);
      storeCredentials(newCredentials);

      return newCredentials.sessionToken;
    } catch (e) {
      clearStorage();
      throw e;
    }
  }
}
