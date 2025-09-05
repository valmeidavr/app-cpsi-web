
import { GET, POST, PATCH } from './route';
import { NextRequest } from 'next/server';
import { gestorPool, executeWithRetry } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
  executeWithRetry: jest.fn(),
}));

describe('API /api/valor-procedimento', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a list of valor-procedimento with pagination', async () => {
      const mockValores = [
        { id: 1, valor: 100, tipo: 'TIPO A' },
        { id: 2, valor: 200, tipo: 'TIPO B' },
      ];
      const mockTotal = 2;

      (executeWithRetry as jest.Mock)
        .mockResolvedValueOnce(mockValores)
        .mockResolvedValueOnce([[{ total: mockTotal }]]);

      const request = new NextRequest('http://localhost/api/valor-procedimento?page=1&limit=10');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual(mockValores.map(v => ({
        ...v, 
        procedimento: { codigo: "N/A", nome: "N/A" }, 
        status: "Ativo",
        tabelaFaturamento: {}
      })));
      expect(body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: mockTotal,
        totalPages: 1,
      });
    });
  });

  describe('POST', () => {
    it('should create a new valor-procedimento', async () => {
      const mockValor = {
        valor: 300,
        tipo: 'TIPO C',
        tabela_faturamento_id: 1,
        procedimento_id: 1,
      };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{ insertId: 3 }]);

      const request = new NextRequest('http://localhost/api/valor-procedimento', {
        method: 'POST',
        body: JSON.stringify(mockValor),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true, id: 3 });
    });
  });

  describe('PATCH', () => {
    it('should update a valor-procedimento', async () => {
      const mockValor = {
        valor: 400,
      };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/valor-procedimento?id=1', {
        method: 'PATCH',
        body: JSON.stringify(mockValor),
      });

      const response = await PATCH(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true, message: 'Valor de procedimento atualizado com sucesso' });
    });

    it('should delete a valor-procedimento', async () => {
        const mockValor = {
            delete: true,
          };

        (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]);

        const request = new NextRequest('http://localhost/api/valor-procedimento?id=1', {
            method: 'PATCH',
            body: JSON.stringify(mockValor),
            });

        const response = await PATCH(request);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ success: true, message: 'Valor de procedimento removido com sucesso' });
        });
    });
});
