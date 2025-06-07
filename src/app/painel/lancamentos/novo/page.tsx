import { Suspense } from 'react';
import NovoLancamento from './NovoLancamento'; // Importa o seu componente de cliente

export default function Page() {
  return (
    // O Suspense boundary é aplicado aqui, no nível da página
    <Suspense fallback={<div>Carregando página de lançamento...</div>}>
      <NovoLancamento />
    </Suspense>
  );
}