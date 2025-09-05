
import { GET } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('API /api/debug/convenios-clientes', () => {
  it('should return debug information about convenios-clientes', async () => {
    const mockTables = [[{ 'Tables_in_gestor': 'convenios_clientes' }]];
    const mockColumns = [[{ Field: 'id' }, { Field: 'convenio_id' }]];
    const mockCount = [[{ total: 5 }]];
    const mockConvenios = [[{ id: 1, convenio_id: 1 }]];

    (gestorPool.execute as jest.Mock)
      .mockResolvedValueOnce(mockTables)
      .mockResolvedValueOnce(mockColumns)
      .mockResolvedValueOnce(mockCount)
      .mockResolvedValueOnce(mockConvenios);

    const request = new NextRequest('http://localhost/api/debug/convenios-clientes');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.debug).toBeDefined();
    expect(body.debug.tabelaExiste).toBe(true);
    expect(body.debug.totalRegistros).toBe(5);
  });

  it('should return convenios for a specific client', async () => {
    const mockTables = [[{ 'Tables_in_gestor': 'convenios_clientes' }]];
    const mockColumns = [[{ Field: 'id' }, { Field: 'convenio_id' }]];
    const mockCount = [[{ total: 5 }]];
    const mockConvenios = [[{ id: 1, convenio_id: 1, convenio_nome: 'Convenio A' }]];

    (gestorPool.execute as jest.Mock)
      .mockResolvedValueOnce(mockTables)
      .mockResolvedValueOnce(mockColumns)
      .mockResolvedValueOnce(mockCount)
      .mockResolvedValueOnce(mockConvenios);

    const request = new NextRequest('http://localhost/api/debug/convenios-clientes?clienteId=1');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.debug).toBeDefined();
    expect(body.debug.clienteId).toBe('1');
    expect(body.debug.conveniosDoCliente).toEqual(mockConvenios[0]);
  });
});
