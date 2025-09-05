
import { GET } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('API /api/convenios-clientes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a list of convenios for a given cliente_id', async () => {
      const mockConvenios = [
        { id: 1, nome: 'Convenio A', convenioId: 1 },
        { id: 2, nome: 'Convenio B', convenioId: 2 },
      ];

      (gestorPool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ 'Tables_in_gestor': 'convenios_clientes' }]]) // table check
        .mockResolvedValueOnce([mockConvenios]); // data

      const request = new NextRequest('http://localhost/api/convenios-clientes?cliente_id=1');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual(mockConvenios);
    });

    it('should return all convenios if cliente_id is not provided', async () => {
        const request = new NextRequest('http://localhost/api/convenios-clientes');
        const response = await GET(request);
        const body = await response.json();
    
        expect(response.status).toBe(400);
        expect(body.error).toBe('cliente_id é obrigatório');
      });

    it('should return all convenios as a fallback if the table does not exist', async () => {
        const mockAllConvenios = [
            { id: 1, nome: 'Convenio A' },
            { id: 2, nome: 'Convenio B' },
          ];

        (gestorPool.execute as jest.Mock)
            .mockResolvedValueOnce([[]]) // table check fails
            .mockResolvedValueOnce([mockAllConvenios]); // fallback data

        const request = new NextRequest('http://localhost/api/convenios-clientes?cliente_id=1');
        const response = await GET(request);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data).toEqual(mockAllConvenios);
        });
  });
});
