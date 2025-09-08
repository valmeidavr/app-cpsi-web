
import type { ReactNode } from "react";
import { AgendaProvider } from "./AgendaContext";
export default function Layout({ children }: { children: ReactNode }) {
  return <AgendaProvider>{children}</AgendaProvider>;
}