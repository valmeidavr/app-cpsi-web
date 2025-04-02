"use client";

//React
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import InputMask from "react-input-mask";

//Zod
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

//Components
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Breadcrumb from "@/components/ui/Breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

//API


//Helpers
import { useRouter } from "next/navigation";
import { createPrestador } from "@/app/api/prestadores/action";
import { formSchema } from "@/app/api/prestadores/schema/formSchemaPretadores";
import { handleCEPChange } from "@/app/helpers/handleCEP";

export default function NovoPrestador() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      status: "",
      nome: "",
      rg: "",
      cpf: "",
      sexo: "",
      dtnascimento: "",
      cep: "",
      logradouro: "",
      numero: "",
      bairro: "",
      cidade: "",
      uf: "",
      telefone: "",
      celular: "",
      complemento: "",
    },
  });

  const handleCEPChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleCEPChange(e, form);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      await createPrestador(values);
      router.push("/painel/prestadores?type=success&message=salvo com sucesso");
    } catch (error) {
      toast.error("Erro ao salvar prestador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Prestadores", href: "/painel/prestadores" },
          { label: "Novo Prestador" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-6 mt-5">Novo Prestador</h1>
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {[
              { name: "status", label: "Status" },
              { name: "nome", label: "Nome" },
              { name: "rg", label: "RG", mask: "99.999.999-9" },
              { name: "cpf", label: "CPF", mask: "999.999.999-99" },
              { name: "sexo", label: "sexo", mask: "999.999.999-99" },
              {
                name: "dtnascimento",
                label: "Data de Nascimento",
                mask: "99/99/9999",
              },
              {
                name: "cep",
                label: "CEP",
                mask: "99999-999",
                onChange: (e: any) => handleCEPChangeHandler(e.target.value),
              },
              { name: "logradouro", label: "Logradouro" },
              { name: "numero", label: "Número" },
              { name: "bairro", label: "Bairro" },
              { name: "cidade", label: "Cidade" },
              { name: "uf", label: "UF" },
              { name: "telefone", label: "Telefone", mask: "(99) 9999-9999" },
              { name: "celular", label: "Celular", mask: "(99) 99999-9999" },
              { name: "complemento", label: "Complemento" },
            ].map(({ name, label, mask, onChange }) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label} *</FormLabel>
                    <FormControl>
                      {mask ? (
                        <InputMask
                          mask={mask}
                          {...field}
                          className="border border-gray-300 focus:ring-2 focus:ring-primary"
                          onChange={(e: any) => {
                            field.onChange(e);
                            if (onChange) onChange(e);
                          }}
                        />
                      ) : (
                        <Input
                          {...field}
                          className="border border-gray-300 focus:ring-2 focus:ring-primary"
                          onChange={(e) => {
                            field.onChange(e);
                            if (onChange) onChange(e);
                          }}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Salvar
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
