import {
  CalendarCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  LockIcon,
  UserCheckIcon,
  CalendarIcon,
} from "lucide-react";

export const statusItems = [
  {
    label: "LIVRE",
    color: "text-green-600",
    icon: <CalendarIcon className="w-4 h-4 mr-2" />,
  },
  {
    label: "AGENDADO",
    color: "text-blue-600",
    icon: <ClockIcon className="w-4 h-4 mr-2" />,
  },
  {
    label: "CONFIRMADO",
    color: "text-purple-600",
    icon: <CalendarCheckIcon className="w-4 h-4 mr-2" />,
  },
  {
    label: "FINALIZADO",
    color: "text-green-700",
    icon: <CheckCircleIcon className="w-4 h-4 mr-2" />,
  },
  {
    label: "FALTA",
    color: "text-red-600",
    icon: <XCircleIcon className="w-4 h-4 mr-2" />,
  },
  {
    label: "BLOQUEADO",
    color: "text-red-700",
    icon: <LockIcon className="w-4 h-4 mr-2" />,
  },
  {
    label: "INATIVO",
    color: "text-gray-500",
    icon: <XCircleIcon className="w-4 h-4 mr-2" />,
  },
];
