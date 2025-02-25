"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Consulta {
  id: number
  paciente: string
  data: Date
  medico: string
  especialidade: string
}

export default function Consultas() {
  const [consultas, setConsultas] = useState<Consulta[]>([
    {
      id: 1,
      paciente: "João Silva",
      data: new Date(2023, 5, 15, 10, 0),
      medico: "Dra. Maria Santos",
      especialidade: "Cardiologia",
    },
    {
      id: 2,
      paciente: "Ana Oliveira",
      data: new Date(2023, 5, 16, 14, 30),
      medico: "Dr. Carlos Ferreira",
      especialidade: "Ortopedia",
    },
    {
      id: 3,
      paciente: "Pedro Costa",
      data: new Date(2023, 5, 17, 9, 0),
      medico: "Dra. Juliana Alves",
      especialidade: "Dermatologia",
    },
  ])

  const [novaConsulta, setNovaConsulta] = useState<Partial<Consulta>>({
    paciente: "",
    data: new Date(),
    medico: "",
    especialidade: "",
  })

  const handleAddConsulta = () => {
    if (novaConsulta.paciente && novaConsulta.data && novaConsulta.medico && novaConsulta.especialidade) {
      setConsultas([...consultas, { ...novaConsulta, id: consultas.length + 1 } as Consulta])
      setNovaConsulta({ paciente: "", data: new Date(), medico: "", especialidade: "" })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Consultas</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Adicionar Consulta</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Consulta</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes da nova consulta aqui. Clique em salvar quando terminar.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="paciente" className="text-right">
                      Paciente
                    </Label>
                    <Input
                      id="paciente"
                      value={novaConsulta.paciente}
                      onChange={(e) => setNovaConsulta({ ...novaConsulta, paciente: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="data" className="text-right">
                      Data
                    </Label>
                    <Calendar
                      mode="single"
                      selected={novaConsulta.data}
                      onSelect={(date) => date && setNovaConsulta({ ...novaConsulta, data: date })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="medico" className="text-right">
                      Médico
                    </Label>
                    <Input
                      id="medico"
                      value={novaConsulta.medico}
                      onChange={(e) => setNovaConsulta({ ...novaConsulta, medico: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="especialidade" className="text-right">
                      Especialidade
                    </Label>
                    <Input
                      id="especialidade"
                      value={novaConsulta.especialidade}
                      onChange={(e) => setNovaConsulta({ ...novaConsulta, especialidade: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleAddConsulta}>
                    Salvar Consulta
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Médico</TableHead>
              <TableHead>Especialidade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consultas.map((consulta) => (
              <TableRow key={consulta.id}>
                <TableCell>{consulta.paciente}</TableCell>
                <TableCell>{consulta.data.toLocaleString()}</TableCell>
                <TableCell>{consulta.medico}</TableCell>
                <TableCell>{consulta.especialidade}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

