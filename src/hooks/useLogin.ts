import axios, { AxiosError } from "axios";
import { useMutation } from "react-query";

interface LoginResponse {
  result: "ok" | "error";
  token: MangadexUserTokens;
}
interface MangadexUserTokens {
  session: string;
  refresh: string;
}

interface MangadexUserCredentials {
  username: string;
  password: string;
}

export function useLogin() {
  return useMutation<LoginResponse, AxiosError, MangadexUserCredentials>(
    async ({ username, password }: MangadexUserCredentials) => {
      const { data } = await axios.post<LoginResponse>(
        "https://api.mangadex.org/auth/login",
        { username, password }
      );

      return data;
    },
    { mutationKey: "login" }
  );
}
