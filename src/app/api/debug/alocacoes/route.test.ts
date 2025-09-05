
import { GET } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('API /api/debug/alocacoes', () => {
  it('should return debug information about alocacoes', async () => {
    const mockTables = [[{ 'Tables_in_gestor': 'alocacoes' }]];
    const mockColumns = [[{ Field: 'id' }, { Field: 'unidade_id' }]];
    const mockCount = [[{ total: 5 }]];
    const mockAlocacoes = [[{ id: 1, unidade_id: 1 }]];
    const mockEspecialidadesCount = [[{ total: 1 }]];
    const mockUnidadesCount = [[{ total: 1 }]];
    const mockPrestadoresCount = [[{ total: 1 }]];

    (gestorPool.execute as jest.Mock)
      .mockResolvedValueOnce(mockTables)
      .mockResolvedValueOnce(mockColumns)
      .mockResolvedValueOnce(mockCount)
      .mockResolvedValueOnce(mockAlocacoes)
      .mockResolvedValueOnce(mockEspecialidadesCount)
      .mockResolvedValueOnce(mockUnidadesCount)
      .mockResolvedValueOnce(mockPrestadoresCount);

    const request = new NextRequest('http://localhost/api/debug/alocacoes');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.debug).toBeDefined();
    expect(body.debug.tabelaExiste).toBe(true);
    expect(body.debug.totalAlocacoes).toBe(5);
  });
});
