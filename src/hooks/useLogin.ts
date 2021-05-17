import axios, { AxiosError } from "axios";
import { useMutation } from "react-query";

interface LoginResponse {
  result: 'ok' | 'error';
  token: UserTokens;
}
export interface UserTokens {
  session: string;
  refresh: string;
}

interface UserCredentials {
  username: string;
  password: string;
}

export function useLogin() {
  return useMutation<LoginResponse, AxiosError, UserCredentials>(async ({ username, password }: { username: string, password: string }) => {
    const { data } = await axios.post<LoginResponse>(
      "https://api.mangadex.org/auth/login",
      { username, password },
    );
    return data;
  }, { mutationKey: "login" })
}