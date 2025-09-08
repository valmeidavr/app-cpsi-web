
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription, // Importe a descrição
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator"; // Importe o separador
import { Aluno } from "@/app/types/Aluno";
import { formatDate } from "date-fns";
import { formatarTelefone } from "@/util/clearData";
import {
  User,
  Mail,
  Phone,
  CakeSlice,
  CalendarCheck2,
  BadgeCheck,
} from "lucide-react";
interface Props {
  aluno: Aluno | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}
const DetalheItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) => (
  <div className="flex flex-col gap-1">
    <Label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
      {icon}
      {label}
    </Label>
    <p className="text-sm text-foreground">{value}</p>
  </div>
);
export default function AlunoDetalhesModal({
  aluno,
  isOpen,
  onOpenChange,
}: Props) {
  if (!aluno) {
    return null;
  }
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-6 w-6" />
            Detalhes do Aluno
          </DialogTitle>
          <DialogDescription>
            Informações detalhadas do aluno selecionado.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        {}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 py-2">
          {}
          <div className="md:col-span-2">
            <DetalheItem
              icon={<User className="h-4 w-4" />}
              label="Nome Completo"
              value={aluno.cliente.nome}
            />
          </div>
          <DetalheItem
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={aluno.cliente.email || "Não informado"}
          />
          <DetalheItem
            icon={<Phone className="h-4 w-4" />}
            label="Celular"
            value={
              aluno.cliente.telefone1
                ? formatarTelefone(aluno.cliente.telefone1)
                : "Não informado"
            }
          />
          <DetalheItem
            icon={<CakeSlice className="h-4 w-4" />}
            label="Nascimento"
            value={
              aluno.cliente.dtnascimento
                ? formatDate(aluno.cliente.dtnascimento, "dd/MM/yyyy")
                : "Não informado"
            }
          />
          <DetalheItem
            icon={<CalendarCheck2 className="h-4 w-4" />}
            label="Data de Inscrição"
            value={
              aluno.data_inscricao
                ? formatDate(aluno.data_inscricao, "dd/MM/yyyy")
                : "Não informado"
            }
          />
          <DetalheItem
            icon={<BadgeCheck className="h-4 w-4" />}
            label="Status"
            value={aluno.cliente.status!}
          />
        </div>
        <Separator />
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}