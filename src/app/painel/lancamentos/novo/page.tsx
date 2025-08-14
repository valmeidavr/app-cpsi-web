import { Suspense } from "react";
import NovoLancamento from "./NovoLancamento";

export default function NovoLancamentoPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NovoLancamento />
    </Suspense>
  );
}