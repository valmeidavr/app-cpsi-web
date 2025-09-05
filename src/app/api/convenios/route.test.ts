
import { GET, POST, PUT, DELETE } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

// Mock the schema validation
jest.mock('../schema/formSchemaConvenio', () => ({
  createConvenioSchema: {
    safeParse: jest.fn().mockReturnValue({ success: true, data: {} }),
  },
}));

describe('API /api/convenios', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a list of convenios with pagination', async () => {
      const mockConvenios = [
        { id: 1, nome: 'Convenio A', desconto: 10 },
        { id: 2, nome: 'Convenio B', desconto: 20 },
      ];
      const mockTotal = 2;

      (gestorPool.execute as jest.Mock)
        .mockResolvedValueOnce([mockConvenios]) // for the data
        .mockResolvedValueOnce([[{ total: mockTotal }]]); // for the count

      const request = new NextRequest('http://localhost/api/convenios?page=1&limit=10');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual(mockConvenios);
      expect(body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: mockTotal,
        totalPages: 1,
      });
    });
  });

  describe('POST', () => {
    it('should create a new convenio', async () => {
      const mockConvenio = {
        nome: 'Novo Convenio',
        desconto: 15,
        regras: 'Regras do novo convenio',
        tabelaFaturamentosId: 1,
      };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{ insertId: 3 }]);

      const request = new NextRequest('http://localhost/api/convenios', {
        method: 'POST',
        body: JSON.stringify(mockConvenio),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true, id: 3 });
    });
  });

  describe('PUT', () => {
    it('should update a convenio', async () => {
        const mockConvenio = {
            nome: 'Convenio Atualizado',
            desconto: 25,
            regras: 'Regras atualizadas',
            tabelaFaturamentosId: 2,
          };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/convenios?id=1', {
        method: 'PUT',
        body: JSON.stringify(mockConvenio),
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });

  describe('DELETE', () => {
    it('should soft delete a convenio', async () => {
      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/convenios?id=1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});
