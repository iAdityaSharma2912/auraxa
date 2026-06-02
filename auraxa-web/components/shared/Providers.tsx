import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./ThemeProvider";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}