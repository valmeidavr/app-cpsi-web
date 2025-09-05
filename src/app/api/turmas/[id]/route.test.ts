
import { GET, PUT } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('API /api/turmas/[id]', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a turma by id', async () => {
      const mockTurma = { id: 1, nome: 'Turma A' };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[mockTurma]]);

      const request = new NextRequest('http://localhost/api/turmas/1');
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockTurma);
    });

    it('should return 404 if turma not found', async () => {
        (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[]]);
  
        const request = new NextRequest('http://localhost/api/turmas/1');
        const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
        const body = await response.json();
  
        expect(response.status).toBe(404);
        expect(body.error).toBe('Turma não encontrada');
      });
  });

  describe('PUT', () => {
    it('should update a turma', async () => {
      const mockTurma = {
        nome: 'Turma Atualizada',
      };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/turmas/1', {
        method: 'PUT',
        body: JSON.stringify(mockTurma),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});
