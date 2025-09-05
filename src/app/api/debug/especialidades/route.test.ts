
import { GET } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('API /api/debug/especialidades', () => {
  it('should return debug information about especialidades', async () => {
    const mockTables = [[{ 'Tables_in_gestor': 'especialidades' }]];
    const mockColumns = [[{ Field: 'id' }, { Field: 'nome' }]];
    const mockCount = [[{ total: 5 }]];
    const mockEspecialidades = [[{ id: 1, nome: 'Cardiologia' }]];
    const mockStatusCount = [[{ status: 'Ativo', count: 5 }]];

    (gestorPool.execute as jest.Mock)
      .mockResolvedValueOnce(mockTables)
      .mockResolvedValueOnce(mockColumns)
      .mockResolvedValueOnce(mockCount)
      .mockResolvedValueOnce(mockEspecialidades)
      .mockResolvedValueOnce(mockStatusCount);

    const request = new NextRequest('http://localhost/api/debug/especialidades');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.debug).toBeDefined();
    expect(body.debug.tabelaExiste).toBe(true);
    expect(body.debug.totalRegistros).toBe(5);
  });
});
