import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";

// GET - Buscar convênios de um cliente
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get("clienteId");
    if (!clienteId) {
      return NextResponse.json({ error: "clienteId é obrigatório" }, { status: 400 });
    }

    console.log("🔍 Buscando convênios para cliente ID:", clienteId);

    // Primeiro verificar se a tabela convenios_clientes existe
    try {
      const [tableCheck] = await gestorPool.execute(
        "SHOW TABLES LIKE 'convenios_clientes'"
      );
      
      if ((tableCheck as any[]).length === 0) {
        console.log("⚠️ Tabela convenios_clientes não existe, buscando todos os convênios");
        // Fallback: buscar todos os convênios
        const [allConvenios] = await gestorPool.execute(
          "SELECT id, nome, regras, tabelaFaturamentosId as tabela_faturamento_id, desconto FROM convenios"
        );
        return NextResponse.json({ data: allConvenios });
      }
    } catch (tableError) {
      console.log("⚠️ Erro ao verificar tabela convenios_clientes:", tableError);
    }

    // Buscar convênios específicos do cliente
    const [rows] = await gestorPool.execute(
      `SELECT cc.id, cc.desconto, c.id as convenioId, c.nome, c.regras, c.tabelaFaturamentosId as tabela_faturamento_id
       FROM convenios_clientes cc
       INNER JOIN convenios c ON cc.convenio_id = c.id
       WHERE cc.cliente_id = ?`,
      [clienteId]
    );

    console.log("✅ Convênios encontrados:", rows);

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("❌ Erro ao buscar convênios do cliente:", error);
    
    // Fallback: buscar todos os convênios em caso de erro
    try {
      console.log("🔄 Tentando fallback: buscar todos os convênios");
      const [fallbackRows] = await gestorPool.execute(
        "SELECT id, nome, regras, tabelaFaturamentosId as tabela_faturamento_id, desconto FROM convenios"
      );
      return NextResponse.json({ data: fallbackRows });
    } catch (fallbackError) {
      console.error("❌ Erro no fallback:", fallbackError);
      return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
  }
} 