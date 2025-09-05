
import { GET, PUT } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('API /api/convenios/[id]', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a convenio by id', async () => {
      const mockConvenio = { id: 1, nome: 'Convenio A', desconto: 10 };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[mockConvenio]]);

      const request = new NextRequest('http://localhost/api/convenios/1');
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockConvenio);
    });

    it('should return 404 if convenio not found', async () => {
        (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[]]);
  
        const request = new NextRequest('http://localhost/api/convenios/1');
        const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
        const body = await response.json();
  
        expect(response.status).toBe(404);
        expect(body.error).toBe('Convênio não encontrado');
      });
  });

  describe('PUT', () => {
    it('should update a convenio', async () => {
      const mockConvenio = {
        nome: 'Convenio Atualizado',
        desconto: 20,
        regras: 'Novas Regras',
        tabela_faturamento_id: 2,
      };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/convenios/1', {
        method: 'PUT',
        body: JSON.stringify(mockConvenio),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});
