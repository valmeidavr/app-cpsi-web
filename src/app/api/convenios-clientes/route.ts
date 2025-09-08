import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";

// GET - Buscar convênios de um cliente
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get("cliente_id");
    if (!clienteId) {
      return NextResponse.json({ error: "cliente_id é obrigatório" }, { status: 400 });
    }

    // Primeiro verificar se a tabela convenios_clientes existe
    try {
      const [tableCheck] = await accessPool.execute(
        "SHOW TABLES LIKE 'convenios_clientes'"
      );
      
      if ((tableCheck as Array<{ Tables_in_gestor: string }>).length === 0) {
        // Fallback: buscar todos os convênios
        const [allConvenios] = await accessPool.execute(
          "SELECT DISTINCT id, nome, regras, tabelaFaturamentosId as tabela_faturamento_id, desconto FROM convenios ORDER BY nome ASC"
        );
        return NextResponse.json({ data: allConvenios });
      }
    } catch {
      // Tabela não existe, continuar com fallback
    }

    // Buscar convênios específicos do cliente
    const [rows] = await accessPool.execute(
      `SELECT DISTINCT cc.id, cc.desconto, c.id as convenioId, c.nome, c.regras, c.tabelaFaturamentosId as tabela_faturamento_id
       FROM convenios_clientes cc
       INNER JOIN convenios c ON cc.convenio_id = c.id
       WHERE cc.cliente_id = ?
       ORDER BY c.nome ASC`,
      [clienteId]
    );

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("❌ Erro ao buscar convênios do cliente:", error);
    
    // Fallback: buscar todos os convênios em caso de erro
    try {
      const [fallbackRows] = await accessPool.execute(
        "SELECT DISTINCT id, nome, regras, tabelaFaturamentosId as tabela_faturamento_id, desconto FROM convenios ORDER BY nome ASC"
      );
      return NextResponse.json({ data: fallbackRows });
    } catch (fallbackError) {
      console.error("❌ Erro no fallback:", fallbackError);
      return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
  }
} 