import React from "react";
import { Login } from "../../components/Login";

interface Props {
  onLogin: ({
    session,
    refresh,
  }: {
    session: string;
    refresh: string;
  }) => unknown;
}

export function LoginPage({ onLogin }: Props) {
  return <Login onLogin={onLogin} />;
}
