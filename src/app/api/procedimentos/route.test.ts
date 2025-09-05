
import { GET, POST, PUT, DELETE } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('API /api/procedimentos', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a list of procedimentos with pagination', async () => {
      const mockProcedimentos = [
        { id: 1, nome: 'Consulta', codigo: 'C001', status: 'Ativo' },
        { id: 2, nome: 'Exame', codigo: 'E001', status: 'Ativo' },
      ];
      const mockTotal = 2;

      (gestorPool.execute as jest.Mock)
        .mockResolvedValueOnce([mockProcedimentos]) // for the data
        .mockResolvedValueOnce([[{ total: mockTotal }]]); // for the count

      const request = new NextRequest('http://localhost/api/procedimentos?page=1&limit=10');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual(mockProcedimentos);
      expect(body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: mockTotal,
        totalPages: 1,
      });

      expect(gestorPool.execute).toHaveBeenCalledWith(
        'SELECT * FROM procedimentos WHERE status = "Ativo" ORDER BY nome ASC LIMIT ? OFFSET ?',
        [10, 0]
      );
      expect(gestorPool.execute).toHaveBeenCalledWith(
        'SELECT COUNT(*) as total FROM procedimentos WHERE status = "Ativo"',
        []
      );
    });

    it('should handle search parameter', async () => {
      const mockProcedimentos = [
        { id: 1, nome: 'Consulta', codigo: 'C001', status: 'Ativo' },
      ];
      const mockTotal = 1;

      (gestorPool.execute as jest.Mock)
        .mockResolvedValueOnce([mockProcedimentos])
        .mockResolvedValueOnce([[{ total: mockTotal }]]);

      const request = new NextRequest('http://localhost/api/procedimentos?page=1&limit=10&search=Consulta');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual(mockProcedimentos);
      expect(gestorPool.execute).toHaveBeenCalledWith(
        'SELECT * FROM procedimentos WHERE status = "Ativo" AND (nome LIKE ? OR codigo LIKE ?) ORDER BY nome ASC LIMIT ? OFFSET ?',
        ['%Consulta%', '%Consulta%', 10, 0]
      );
      expect(gestorPool.execute).toHaveBeenCalledWith(
        'SELECT COUNT(*) as total FROM procedimentos WHERE status = "Ativo" AND (nome LIKE ? OR codigo LIKE ?)',
        ['%Consulta%', '%Consulta%']
      );
    });

    it('should return 500 on database error', async () => {
        (gestorPool.execute as jest.Mock).mockRejectedValue(new Error('DB Error'));
  
        const request = new NextRequest('http://localhost/api/procedimentos');
        const response = await GET(request);
        const body = await response.json();
  
        expect(response.status).toBe(500);
        expect(body.error).toBe('Erro interno do servidor');
      });
  });
});
