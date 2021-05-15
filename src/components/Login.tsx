import axios from 'axios';
import React, { useState } from 'react'
import { useMutation } from 'react-query';

interface LoginResponse {
  result: 'ok' | 'error';
  token: {
    session: string;
    refresh: string;
  };
}


function useLogin() {
  return useMutation(async ({ username, password }: { username: string, password: string }) => {
    const { data } = await axios.post<LoginResponse>(
      "https://api.mangadex.org/auth/login",
      { username, password },
    );
    return data;
  }, { mutationKey: "login" })
}

export function Login() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { mutate: login } = useLogin();

  return (
    <>
      <input name="username" type="text" onChange={(e) => setUsername(e.target.value)}/>
      <input name="password" type="password" onChange={(e) => setPassword(e.target.value)}/>
      <button onClick={() => login({ username, password })}> Log in </button>
    </>
  )
}
