export const formatCEP = (value: string) => {
  const numbers = value.replace(/\D/g, ""); // Remove tudo que não for número
  if (numbers.length <= 5) {
    return numbers;
  }
  return numbers.replace(/^(\d{5})(\d{1,3})$/, "$1-$2").slice(0, 9); // Insere a máscara corretamente
};
export const handleCEPChange = async (
  e: React.ChangeEvent<HTMLInputElement>,
  form: {
    setValue: (field: string, value: string) => void;
    setError: (field: string, error: { type: string; message: string }) => void;
    clearErrors: (field: string) => void;
  }
) => {
  const rawCEP = e.target.value;
  const formattedCEP = formatCEP(rawCEP); 
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
    } catch {
      form.setError("cep", {
        type: "manual",
        message: "Erro ao buscar CEP. Tente novamente.",
      });
    }
  }
};