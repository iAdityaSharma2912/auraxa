"use client";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
export default function TokenSync() {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === "loading") return;
    const token = (session as any)?.backendToken;
    if (token) {
      localStorage.setItem("auraxa_token", token);
    } else if (status === "unauthenticated") {
      localStorage.removeItem("auraxa_token");
    }
  }, [session, status]);
  return null;
}