import { Login, Props as LoginProps } from "../../components/Login";

interface Props {
  onLogin: LoginProps["onLogin"];
}

export function LoginPage({ onLogin }: Props) {
  return <Login onLogin={onLogin} />;
}
