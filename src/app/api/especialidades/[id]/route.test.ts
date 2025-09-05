
import { GET, PUT } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('API /api/especialidades/[id]', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return an especialidade by id', async () => {
      const mockEspecialidade = { id: 1, nome: 'Cardiologia', codigo: 'C01' };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[mockEspecialidade]]);

      const request = new NextRequest('http://localhost/api/especialidades/1');
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockEspecialidade);
    });

    it('should return 404 if especialidade not found', async () => {
        (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[]]);
  
        const request = new NextRequest('http://localhost/api/especialidades/1');
        const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
        const body = await response.json();
  
        expect(response.status).toBe(404);
        expect(body.error).toBe('Especialidade não encontrada');
      });
  });

  describe('PUT', () => {
    it('should update an especialidade', async () => {
      const mockEspecialidade = {
        nome: 'Especialidade Atualizada',
        codigo: 'EA01',
      };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/especialidades/1', {
        method: 'PUT',
        body: JSON.stringify(mockEspecialidade),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});
