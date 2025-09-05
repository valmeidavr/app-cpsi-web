
import { GET } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('API /api/procedimentos/convenio', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a list of procedimentos for a given convenio_id and tipoCliente', async () => {
      const mockProcedimentos = [
        { id: 1, nome: 'Procedimento A', codigo: 'P01' },
        { id: 2, nome: 'Procedimento B', codigo: 'P02' },
      ];

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([mockProcedimentos]);

      const request = new NextRequest('http://localhost/api/procedimentos/convenio?convenio_id=1&tipoCliente=SOCIO');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual(mockProcedimentos);
      expect(body.success).toBe(true);
    });

    it('should return 400 if convenio_id or tipoCliente are missing', async () => {
        const request = new NextRequest('http://localhost/api/procedimentos/convenio');
        const response = await GET(request);
        const body = await response.json();
  
        expect(response.status).toBe(400);
        expect(body.error).toBe('convênio_id e tipoCliente são obrigatórios');
      });
  });
});
