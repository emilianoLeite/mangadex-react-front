import axios, { AxiosError } from "axios";
import { useMutation } from "react-query";

interface LoginResponse {
  result: "ok" | "error";
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
  return useMutation<LoginResponse, AxiosError, UserCredentials>(
    async ({ username, password }: UserCredentials) => {
      const { data } = await axios.post<LoginResponse>(
        "https://api.mangadex.org/auth/login",
        { username, password }
      );

      // TODO set credentials
      return data;
    },
    { mutationKey: "login" }
  );
}
