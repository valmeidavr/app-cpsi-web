import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";

const options = [
  "Segunda a Sexta",
  "Segunda, Quarta e Sexta",
  "Terça e Quinta",
  "Todos os dias",
];

export function SemanaSelectForm() {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      semana: "",
    },
  });

  const onSubmit = (data: any) => {
    console.log("Selecionado:", data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="semana"
        control={control}
        render={({ field }) => {
          const selected = field.value;
          const [open, setOpen] = useState(false);

          return (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Dias da semana
              </label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selected || "Selecione os dias"}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Procurar..." />
                    <CommandEmpty>Nenhuma opção encontrada.</CommandEmpty>
                    <CommandGroup>
                      {options.map((option) => (
                        <CommandItem
                          key={option}
                          onSelect={() => {
                            field.onChange(option);
                            setOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          {option}
                          {selected === option && (
                            <Check className="ml-auto h-4 w-4 text-primary" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          );
        }}
      />

      <Button type="submit">Enviar</Button>
    </form>
  );
}
