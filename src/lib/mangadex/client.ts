import axios from "axios";
import type { RefreshTokenRequest, RefreshTokenResponse } from "./interfaces";

type SessionToken = string;

interface Credentials {
  sessionToken: string;
  sessionTTL: number;
  refreshToken: string;
}

const fifteenMinutesFromNow = 15 * 60 * 1000;
const sessionTokenTTLTime = fifteenMinutesFromNow;
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
export async function getFreshSessionToken(): Promise<SessionToken> {
  // verifica TTL do sessionToken
  // -- se expirado, usa o refresh pra pegar um novo
  // ---- se falhar, temos que explodir algum erro, e limpar storage
  // -- se valido, retorna session
  const { sessionTTL, sessionToken, refreshToken } =
    ensureCredentialsArePersisted();

  if (new Date().getTime() < sessionTTL) {
    return Promise.resolve(sessionToken);
  } else {
    try {
      const { sessionToken } = await refreshCredentials(refreshToken);
      return sessionToken;
    } catch {
      return Promise.reject();
    }
  }
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
    sessionTTL: new Date().getTime() + sessionTokenTTLTime,
  };
}
