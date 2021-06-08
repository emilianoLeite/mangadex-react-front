import { authApi } from "./AuthApi";
import type {
  Login as MangadexUserCredentials
} from "mangadex-client";

type SessionToken = string;

interface Credentials {
  sessionToken: string;
  sessionTTL: number;
  refreshToken: string;
}

const fifteenMinutesFromNow = () => new Date().getTime() + 15 * 60 * 1000;
const sessionTokenTTLKey = "session-token-ttl";
const sessionTokenKey = "session-token";
const refreshTokenKey = "refresh-token";

// function followedMangaList() {
//   const currentSession = getFreshSessionToken();
// }

export async function login(
  userCredentials: MangadexUserCredentials
): Promise<Credentials> {
  const {
    data: { token },
  } = await authApi.postAuthLogin({
    login: userCredentials,
  });

  const credentials = {
    sessionTTL: fifteenMinutesFromNow(),
    sessionToken: token.session,
    refreshToken: token.refresh,
  };

  storeCredentials(credentials);

  return credentials;
}

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
  const requestParams = {
    refreshToken: { token: refreshToken },
  };

  const {
    data: { token },
  } = await authApi.postAuthRefresh(requestParams);
  return {
    refreshToken: token.refresh,
    sessionToken: token.session,
    sessionTTL: fifteenMinutesFromNow(),
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
