export interface RefreshTokenRequest {
  token: string;
}

export interface RefreshTokenResponse {
  token: {
    session: string;
    refresh: string;
  };
  result: "ok" | "error";
  message: string;
}
