import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileQuestion, Home, MoveLeft } from "lucide-react";
import { cookies } from "next/headers";
export default async function NotFound() {
  const cookiesStore = await cookies(); 
  const token = cookiesStore.get("accessToken")?.value;
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4 md:p-8">
      <Card className="mx-auto max-w-md border-2 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="relative">
              <FileQuestion className="h-16 w-16 text-muted-foreground opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">?</span>
              </div>
            </div>
          </div>
          <CardTitle className="text-4xl font-extrabold tracking-tight">
            404
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-2 text-xl font-semibold">Página não encontrada</p>
          <p className="text-muted-foreground">
            Desculpe, não conseguimos encontrar a página que você está
            procurando.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full gap-2">
            <Link href={token ? "/painel" : "/"}>
              <Home className="h-4 w-4" />
              Voltar para a página inicial
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full gap-2">
            <Link href="javascript:history.back()">
              <MoveLeft className="h-4 w-4" />
              Voltar para a página anterior
            </Link>
          </Button>
        </CardFooter>
      </Card>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Se você acredita que isso é um erro, por favor entre em contato com o
        suporte.
      </p>
    </div>
  );
}