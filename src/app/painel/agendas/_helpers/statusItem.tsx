import {
  CalendarCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "lucide-react";

export const statusItems = [
  {
    label: "INATIVO",
    color: "text-gray-500",
    icon: <XCircleIcon className="w-4 h-4 mr-2" />,
  },
  {
    label: "FALTA",
    color: "text-red-500",
    icon: <XCircleIcon className="w-4 h-4 mr-2" />,
  },
  {
    label: "FINALIZADO",
    color: "text-red-500",
    icon: <CheckCircleIcon className="w-4 h-4 mr-2" />,
  },

  {
    label: "CONFIRMADO",
    color: "text-purple-500",
    icon: <CalendarCheckIcon className="w-4 h-4 mr-2" />,
  },
];
