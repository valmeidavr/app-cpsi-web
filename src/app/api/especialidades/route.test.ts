
import { GET, POST, PUT, DELETE } from './route';
import { NextRequest } from 'next/server';
import { gestorPool, executeWithRetry } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
  executeWithRetry: jest.fn(),
}));

// Mock the schema validation
jest.mock('../schema/formSchemaEspecialidade', () => ({
  createEspecialidadeSchema: {
    safeParse: jest.fn().mockReturnValue({ success: true, data: {} }),
  },
  updateEspecialidadeSchema: {
    safeParse: jest.fn().mockReturnValue({ success: true, data: {} }),
  },
}));

describe('API /api/especialidades', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a list of especialidades with pagination', async () => {
      const mockEspecialidades = [
        { id: 1, nome: 'Cardiologia', codigo: 'C01' },
        { id: 2, nome: 'Dermatologia', codigo: 'D01' },
      ];
      const mockTotal = 2;

      (executeWithRetry as jest.Mock)
        .mockResolvedValueOnce([{ total: mockTotal }]) // for the count
        .mockResolvedValueOnce(mockEspecialidades); // for the data

      const request = new NextRequest('http://localhost/api/especialidades?page=1&limit=10');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual(mockEspecialidades);
      expect(body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: mockTotal,
        totalPages: 1,
      });
    });

    it('should return all especialidades when all=true', async () => {
        const mockEspecialidades = [
          { id: 1, nome: 'Cardiologia', codigo: 'C01' },
          { id: 2, nome: 'Dermatologia', codigo: 'D01' },
        ];
  
        (gestorPool.execute as jest.Mock).mockResolvedValueOnce([mockEspecialidades]);
  
        const request = new NextRequest('http://localhost/api/especialidades?all=true');
        const response = await GET(request);
        const body = await response.json();
  
        expect(response.status).toBe(200);
        expect(body.data).toEqual(mockEspecialidades);
      });
  });

  describe('POST', () => {
    it('should create a new especialidade', async () => {
      const mockEspecialidade = {
        nome: 'Nova Especialidade',
        codigo: 'NE01',
      };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{ insertId: 3 }]);

      const request = new NextRequest('http://localhost/api/especialidades', {
        method: 'POST',
        body: JSON.stringify(mockEspecialidade),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true, id: 3 });
    });
  });

  describe('PUT', () => {
    it('should update an especialidade', async () => {
        const mockEspecialidade = {
            nome: 'Especialidade Atualizada',
            codigo: 'EA01',
          };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/especialidades?id=1', {
        method: 'PUT',
        body: JSON.stringify(mockEspecialidade),
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });

  describe('DELETE', () => {
    it('should soft delete an especialidade', async () => {
      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/especialidades?id=1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});
