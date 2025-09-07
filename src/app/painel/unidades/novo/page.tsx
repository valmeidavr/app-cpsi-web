'use client';
//React
import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

//Zod
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
//Components
import Breadcrumb from '@/components/ui/Breadcrumb';
import { Save, Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

//API
import { http } from '@/util/http';

//helpers
import { handleCEPChange } from '@/app/helpers/handleCEP';
import { formatTelefoneInput } from '@/app/helpers/format';
import { createUnidadeSchema } from '@/app/api/unidades/schema/formSchemaUnidade';

export default function UnitRegistrationForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof createUnidadeSchema>>({
    resolver: zodResolver(createUnidadeSchema),
    mode: 'onChange',
    defaultValues: {
      nome: '',
      descricao: '',
      cep: '',
      logradouro: '',
      numero: '',
      bairro: '',
      cidade: '',
      uf: '',
      telefone1: '',
      telefone2: '',
      email: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof createUnidadeSchema>) => {
    setLoading(true);
    try {
      await http.post('/api/unidades', values);

      const currentUrl = new URL(window.location.href);
      const queryParams = new URLSearchParams(currentUrl.search);

      queryParams.set('type', 'success');
      queryParams.set('message', 'Unidade salva com sucesso!');

      router.push(`/painel/unidades?${queryParams.toString()}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro ao salvar unidade';

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCEPChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleCEPChange(e, {
      setValue: (field: string, value: string) =>
        form.setValue(
          field as keyof z.infer<typeof createUnidadeSchema>,
          value
        ),
      setError: (field: string, error: { type: string; message: string }) =>
        form.setError(
          field as keyof z.infer<typeof createUnidadeSchema>,
          error
        ),
      clearErrors: (field: string) =>
        form.clearErrors(field as keyof z.infer<typeof createUnidadeSchema>),
    });
  };

  return (
    <div className="flex flex-col flex-1 h-full">
      <Breadcrumb
        items={[
          { label: 'Painel', href: '/painel' },
          { label: 'Unidades', href: '/painel/unidades' },
          { label: 'Nova Unidade' },
        ]}
      />
      <Form {...form}>
        <h1 className="text-2xl font-bold mb-4 mt-5">Nova Unidade</h1>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto space-y-4 p-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      className={`border ${
                        form.formState.errors.nome
                          ? 'border-red-500'
                          : 'border-gray-300'
                      } focus:ring-2 focus:ring-primary`}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm mt-1">
                    {form.formState.errors.nome?.message}
                  </FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      className={`border ${
                        form.formState.errors.descricao
                          ? 'border-red-500'
                          : 'border-gray-300'
                      } focus:ring-2 focus:ring-primary`}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm mt-1">
                    {form.formState.errors.descricao?.message}
                  </FormMessage>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <FormField
              control={form.control}
              name="cep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="00000-000"
                      maxLength={9}
                      value={field.value || ''}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, ''); // Remove não numéricos
                        const inputEvent = e.nativeEvent as InputEvent;

                        if (inputEvent.inputType === 'deleteContentBackward') {
                          // Permite apagar sem reformatar
                          field.onChange(rawValue);
                        } else {
                          field.onChange(
                            rawValue.replace(/^(\d{5})(\d)/, '$1-$2')
                          ); // Aplica a máscara ao digitar
                        }

                        // Chama a função handleCEPChangeHandler após atualizar o valor
                        handleCEPChangeHandler(e);
                      }}
                      className={`border ${
                        form.formState.errors.cep
                          ? 'border-red-500'
                          : 'border-gray-300'
                      } focus:ring-2 focus:ring-primary`}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logradouro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logradouro</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="bairro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <FormField
              control={form.control}
              name="cidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="uf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UF</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="telefone1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone 1</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Telefone"
                      maxLength={15}
                      value={field.value || ''}
                      onChange={(e) => {
                        const formattedPhone = formatTelefoneInput(
                          e.target.value
                        );
                        field.onChange(formattedPhone);
                      }}
                      className={`border ${
                        form.formState.errors.telefone1
                          ? 'border-red-500'
                          : 'border-gray-300'
                      } focus:ring-2 focus:ring-primary`}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefone2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone 2</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Telefone"
                      maxLength={15}
                      value={field.value || ''}
                      onChange={(e) => {
                        const formattedPhone = formatTelefoneInput(
                          e.target.value
                        );
                        field.onChange(formattedPhone);
                      }}
                      className={`border ${
                        form.formState.errors.telefone2
                          ? 'border-red-500'
                          : 'border-gray-300'
                      } focus:ring-2 focus:ring-primary`}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      {...field}
                      value={field.value || ''}
                      className={`border ${
                        form.formState.errors.email
                          ? 'border-red-500'
                          : 'border-gray-300'
                      } focus:ring-2 focus:ring-primary`}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
