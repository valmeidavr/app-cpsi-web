import { NextRequest, NextResponse } from "next/server";
import { accessPool, executeWithRetry } from "@/lib/mysql";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    switch (type) {
      case 'caixa-movimento':
        return await getCaixaMovimento(startDate, endDate);
      case 'agendamentos':
        return await getAgendamentos(startDate, endDate);
      case 'novos-clientes':
        return await getNovosClientes(startDate, endDate);
      case 'resumo':
        return await getResumo(startDate, endDate);
      default:
        return NextResponse.json(
          { error: 'Tipo de dados não especificado' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Erro na API do dashboard:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function getCaixaMovimento(startDate: string | null, endDate: string | null) {
  try {
    let query = `
      SELECT 
        DATE(l.data_lancamento) as data,
        SUM(CASE WHEN l.tipo = 'ENTRADA' THEN l.valor ELSE 0 END) as entradas,
        SUM(CASE WHEN l.tipo = 'SAIDA' THEN l.valor ELSE 0 END) as saidas
      FROM lancamentos l
      WHERE l.status = 'Ativo'
        AND l.valor IS NOT NULL
    `;
    
    const params: string[] = [];
    if (startDate && endDate) {
      query += ' AND DATE(l.data_lancamento) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else {
      // Últimos 30 dias por padrão
      query += ' AND DATE(l.data_lancamento) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    }
    
    query += ' GROUP BY DATE(l.data_lancamento) ORDER BY data DESC LIMIT 30';
    
    const rows = await executeWithRetry(accessPool, query, params);
    
    return NextResponse.json({
      success: true,
      data: (rows as Array<{
        data: string;
        entradas: number;
        saidas: number;
      }>).map(row => ({
        ...row,
        saldo: row.entradas - row.saidas
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar movimento de caixa:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do caixa' },
      { status: 500 }
    );
  }
}

async function getAgendamentos(startDate: string | null, endDate: string | null) {
  try {
    let query = `
      SELECT 
        DATE(a.dtagenda) as data,
        COUNT(*) as total,
        SUM(CASE WHEN a.situacao = 'AGENDADO' THEN 1 ELSE 0 END) as agendados,
        SUM(CASE WHEN a.situacao = 'FINALIZADO' THEN 1 ELSE 0 END) as finalizados,
        SUM(CASE WHEN a.situacao = 'FALTA' THEN 1 ELSE 0 END) as faltas
      FROM agendas a
      WHERE 1=1
    `;
    
    const params: string[] = [];
    if (startDate && endDate) {
      query += ' AND DATE(a.dtagenda) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else {
      // Últimos 30 dias por padrão
      query += ' AND DATE(a.dtagenda) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    }
    
    query += ' GROUP BY DATE(a.dtagenda) ORDER BY data DESC LIMIT 30';
    
    const rows = await executeWithRetry(accessPool, query, params);
    
    console.log('🔍 Dados brutos do MySQL:', rows);
    
    // Converter explicitamente para números para evitar problemas de tipo
    const processedData = (rows as Array<any>).map(row => ({
      data: row.data,
      total: parseInt(row.total) || 0,
      agendados: parseInt(row.agendados) || 0,
      finalizados: parseInt(row.finalizados) || 0,
      faltas: parseInt(row.faltas) || 0
    }));
    
    console.log('✅ Dados processados:', processedData);
    
    return NextResponse.json({
      success: true,
      data: processedData
    });
  } catch (error) {
    console.error('❌ Erro ao buscar agendamentos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados de agendamentos' },
      { status: 500 }
    );
  }
}

async function getNovosClientes(startDate: string | null, endDate: string | null) {
  try {
    let query = `
      SELECT 
        DATE(c.created_at) as data,
        COUNT(*) as total
      FROM clientes c
      WHERE c.status = 'Ativo'
    `;
    
    const params: string[] = [];
    if (startDate && endDate) {
      query += ' AND DATE(c.created_at) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else {
      // Últimos 30 dias por padrão
      query += ' AND DATE(c.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    }
    
    query += ' GROUP BY DATE(c.created_at) ORDER BY data DESC LIMIT 30';
    
    const rows = await executeWithRetry(accessPool, query, params);
    
    return NextResponse.json({
      success: true,
      data: rows as Array<{
        data: string;
        total: number;
      }>
    });
  } catch (error) {
    console.error('Erro ao buscar novos clientes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados de novos clientes' },
      { status: 500 }
    );
  }
}

async function getResumo(startDate: string | null, endDate: string | null) {
  try {
    let dateCondition = '';
    const params: string[] = [];
    
    if (startDate && endDate) {
      dateCondition = ' AND DATE(data_campo) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else {
      dateCondition = ' AND DATE(data_campo) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    }

    // Total de receitas
    const receitasQuery = `
      SELECT COALESCE(SUM(l.valor), 0) as total
      FROM lancamentos l
      WHERE l.status = 'Ativo' 
        AND l.tipo = 'ENTRADA'
        AND l.valor IS NOT NULL
        ${dateCondition.replace('data_campo', 'l.data_lancamento')}
    `;
    const receitasRows = await executeWithRetry(accessPool, receitasQuery, params);
    const totalReceitas = (receitasRows as Array<{ total: number }>)[0]?.total || 0;

    // Total de despesas
    const despesasQuery = `
      SELECT COALESCE(SUM(l.valor), 0) as total
      FROM lancamentos l
      WHERE l.status = 'Ativo' 
        AND l.tipo = 'SAIDA'
        AND l.valor IS NOT NULL
        ${dateCondition.replace('data_campo', 'l.data_lancamento')}
    `;
    const despesasRows = await executeWithRetry(accessPool, despesasQuery, params);
    const totalDespesas = (despesasRows as Array<{ total: number }>)[0]?.total || 0;

    // Total de agendamentos
    const agendamentosQuery = `
      SELECT COUNT(*) as total
      FROM agendas a
      WHERE 1=1 ${dateCondition.replace('data_campo', 'a.dtagenda')}
    `;
    const agendamentosRows = await executeWithRetry(accessPool, agendamentosQuery, params);
    const totalAgendamentos = (agendamentosRows as Array<{ total: number }>)[0]?.total || 0;

    // Novos clientes
    const clientesQuery = `
      SELECT COUNT(*) as total
      FROM clientes c
      WHERE c.status = 'Ativo' ${dateCondition.replace('data_campo', 'c.created_at')}
    `;
    const clientesRows = await executeWithRetry(accessPool, clientesQuery, params);
    const novosClientes = (clientesRows as Array<{ total: number }>)[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: {
        totalReceitas,
        totalDespesas,
        saldoLiquido: totalReceitas - totalDespesas,
        totalAgendamentos,
        novosClientes
      }
    });
  } catch (error) {
    console.error('Erro ao buscar resumo:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar resumo' },
      { status: 500 }
    );
  }
}