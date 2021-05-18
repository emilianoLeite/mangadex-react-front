import React, { useContext } from "react";
import { AuthContext } from "../../App";
import { HomePage } from "./HomePage";

export function PrivatePages() {
  const tokens = useContext(AuthContext);

  return tokens ? <HomePage /> : <></>;
}
