"use client";

import * as React from "react";
import { decodeJWT } from "@/lib/jwt/engine";
import type { DecodeJWTResult } from "@/lib/jwt/engine";

export function useJwt(initialToken = "") {
  const [token, setToken] = React.useState(initialToken);

  const result = React.useMemo<DecodeJWTResult | null>(() => {
    if (token.trim().length === 0) return null;
    return decodeJWT(token);
  }, [token]);

  const clear = React.useCallback(() => {
    setToken("");
  }, []);

  return { token, setToken, result, clear };
}
