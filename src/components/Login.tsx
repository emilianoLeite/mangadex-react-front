import { useEffect, useState } from "react";
import { useLogin } from "../hooks/useLogin";

export interface Props {
  onLogin: ({
    sessionToken,
    refreshToken,
  }: {
    sessionToken: string;
    refreshToken: string;
  }) => unknown;
}

export function Login({ onLogin }: Props) {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { mutate: login, error, data } = useLogin();

  useEffect(() => {
    if (data)
      onLogin({
        sessionToken: data.token.session,
        refreshToken: data.token.refresh,
      });
  }, [data, onLogin]);

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <input
        name="username"
        type="text"
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        name="password"
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        name="log in"
        type="button"
        onClick={() => login({ username, password })}
      >
        {" "}
        Log in{" "}
      </button>
      {error ? <span>{error.message}</span> : <></>}
    </form>
  );
}
