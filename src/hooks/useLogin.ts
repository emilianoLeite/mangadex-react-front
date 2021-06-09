import type { AxiosError } from "axios";
import type { LoginResponse } from "mangadex-client";
import { useMutation } from "react-query";
import { authApi } from "../lib/mangadex/AuthApi";

interface MangadexUserCredentials {
  username: string;
  password: string;
}

export function useLogin() {
  return useMutation<LoginResponse, AxiosError, MangadexUserCredentials>(
    async (userCredentials: MangadexUserCredentials) => {
      // TODO use lib method
      const { data } = await authApi.postAuthLogin({
        login: userCredentials,
      });
      return data;
    },
    { mutationKey: "login" }
  );
}
