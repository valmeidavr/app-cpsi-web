const formatCEP = (value: string) => {
  return value
    .replace(/\D/g, "") // Remove tudo que não for número
    .replace(/^(\d{5})(\d{1,3})?$/, "$1-$2") // Insere a máscara corretamente
    .slice(0, 9); // Limita a 9 caracteres (00000-000)
};

export const handleCEPChange = async (
  e: React.ChangeEvent<HTMLInputElement>,
  form: any 
) => {
  let rawCEP = e.target.value;
  let formattedCEP = formatCEP(rawCEP); 

  form.setValue("cep", formattedCEP); 
  const onlyNumbers = formattedCEP.replace(/\D/g, ""); 

  if (onlyNumbers.length === 8) {
    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${onlyNumbers}/json/`
      );
      const data = await response.json();

      if (!data.erro) {
        form.setValue("logradouro", data.logradouro || "");
        form.setValue("bairro", data.bairro || "");
        form.setValue("cidade", data.localidade || "");
        form.setValue("uf", data.uf || "");
        form.clearErrors("cep"); 
      } else {
        form.setError("cep", {
          type: "manual",
          message: "CEP não encontrado",
        });
      }
    } catch (error) {
      form.setError("cep", {
        type: "manual",
        message: "Erro ao buscar CEP. Tente novamente.",
      });
    }
  }
};
