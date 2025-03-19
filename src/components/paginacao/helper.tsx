const MAX_PAGES = 5;

export const getPaginationRange = (
  currentPage: number,
  totalPages: number
): number[] => {
  /*
        divide o numero maximo de paginas ao meio e arredonda para baixo.
        serve para saber quantas paginas devemos mostrar antes e depois da pagina atual.
    */
  const halfMaxPages = Math.floor(MAX_PAGES / 2);

  /* 
        pega o valor da pagina atual e subtrai pela
        quantidade de paginas anteriores que devem ser mostradas
    */
  const startPageOffset = currentPage - halfMaxPages;

  /* 
        retorna qual a pagina inicial, nao deixando a pagina inicial ser menor que 1.
    */
  let startPage = Math.max(1, startPageOffset);

  // retorna a ultima pagina
  const endPage = startPage + (MAX_PAGES - 1);

  // ajuste do intervalo se exceder o total de paginas
  if (endPage > totalPages) {
    startPage = Math.max(1, totalPages - MAX_PAGES + 1);
  }

  const paginationLength = totalPages < MAX_PAGES ? totalPages : MAX_PAGES;

  return Array.from(
    { length: paginationLength },
    (_, value) => startPage + value
  );
};
