import { GET, POST, PUT, DELETE } from './route';
import { NextRequest } from 'next/server';
import { gestorPool, executeWithRetry } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
  executeWithRetry: jest.fn(),
}));

describe('API /api/agendas', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a list of agendas with pagination', async () => {
      const mockAgendas = [
        { id: 1, dtagenda: '2023-10-06T10:00:00.000Z', situacao: 'AGENDADO' },
        { id: 2, dtagenda: '2023-10-06T11:00:00.000Z', situacao: 'LIVRE' },
      ];
      const mockTotal = 2;

      (executeWithRetry as jest.Mock)
        .mockResolvedValueOnce(mockAgendas)
        .mockResolvedValueOnce([{ total: mockTotal }]);

      const request = new NextRequest('http://localhost/api/agendas?page=1&limit=10');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual(mockAgendas);
      expect(body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: mockTotal,
        totalPages: 1,
      });
    });
  });

  describe('POST', () => {
    it('should create a new agenda and a lancamento', async () => {
      const mockAgenda = {
        dtagenda: '2023-10-06T10:00:00.000Z',
        situacao: 'AGENDADO',
        cliente_id: 1,
        convenio_id: 1,
        procedimento_id: 1,
        prestador_id: 1,
        unidade_id: 1,
        especialidade_id: 1,
        tipo: 'PROCEDIMENTO',
        tipo_cliente: 'SOCIO',
        horario: '10:00',
      };

      (executeWithRetry as jest.Mock)
        .mockResolvedValueOnce({ insertId: 3 }) // agenda creation
        .mockResolvedValueOnce([[{ nome: 'Cliente Teste' }]]) // cliente fetch
        .mockResolvedValueOnce([[{ nome: 'Procedimento Teste' }]]) // procedimento fetch
        .mockResolvedValueOnce([[{ id: 1 }]]) // caixa fetch
        .mockResolvedValueOnce([[{ id: 1 }]]) // plano_conta fetch
        .mockResolvedValueOnce([[{ login: 'admin' }]]) // usuario fetch
        .mockResolvedValueOnce([{}]); // lancamento creation

      const request = new NextRequest('http://localhost/api/agendas', {
        method: 'POST',
        body: JSON.stringify(mockAgenda),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true, id: 3 });
    });
  });

  describe('PUT', () => {
    it('should update an agenda', async () => {
        const mockAgenda = {
            dtagenda: '2023-10-06T10:00:00.000Z',
            situacao: 'FINALIZADO',
            horario: '10:00',
          };

      (executeWithRetry as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/agendas?id=1', {
        method: 'PUT',
        body: JSON.stringify(mockAgenda),
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });

  describe('DELETE', () => {
    it('should soft delete an agenda', async () => {
      (executeWithRetry as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/agendas?id=1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});