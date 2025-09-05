
import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('API /api/alunos_turmas', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a list of alunos_turmas with pagination', async () => {
      const mockAlunosTurmas = [
        { id: 1, cliente_id: 1, turma_id: 1 },
        { id: 2, cliente_id: 2, turma_id: 1 },
      ];
      const mockTotal = 2;

      (gestorPool.execute as jest.Mock)
        .mockResolvedValueOnce([mockAlunosTurmas]) // for the data
        .mockResolvedValueOnce([[{ total: mockTotal }]]); // for the count

      const request = new NextRequest('http://localhost/api/alunos_turmas?page=1&limit=10&turmaId=1');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual(mockAlunosTurmas);
      expect(body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: mockTotal,
        totalPages: 1,
      });
    });
  });

  describe('POST', () => {
    it('should create a new aluno_turma', async () => {
      const mockAlunoTurma = {
        cliente_id: 3,
        turma_id: 1,
        data_inscricao: '2023-10-06',
      };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{ insertId: 3 }]);

      const request = new NextRequest('http://localhost/api/alunos_turmas', {
        method: 'POST',
        body: JSON.stringify(mockAlunoTurma),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true, id: 3 });
    });
  });
});
