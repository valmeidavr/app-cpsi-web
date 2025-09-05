
import { GET, PUT } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';
import { updateClienteSchema } from '../shema/formSchemaCliente';
import { z } from 'zod';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

jest.mock('../shema/formSchemaCliente', () => ({
    updateClienteSchema: {
        safeParse: jest.fn().mockReturnValue({ success: true, data: {} }),
    }
}));

describe('API /api/clientes/[id]', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a cliente by id', async () => {
      const mockCliente = { id: 1, nome: 'Cliente A', email: 'clienteA@test.com' };
      const mockConvenios = [{ convenio_id: 1, desconto: 10 }];

      (gestorPool.execute as jest.Mock)
        .mockResolvedValueOnce([[mockCliente]])
        .mockResolvedValueOnce([mockConvenios]);

      const request = new NextRequest('http://localhost/api/clientes/1');
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ ...mockCliente, convenios: [{ convenioId: 1, desconto: 10 }] });
    });

    it('should return 404 if cliente not found', async () => {
        (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[]]);
  
        const request = new NextRequest('http://localhost/api/clientes/1');
        const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
        const body = await response.json();
  
        expect(response.status).toBe(404);
        expect(body.error).toBe('Cliente não encontrado');
      });
  });

  describe('PUT', () => {
    it('should update a cliente', async () => {
      const mockCliente = {
        nome: 'Cliente Atualizado',
        email: 'clienteB@test.com',
        convenios: [1, 2],
        desconto: { '1': 10, '2': 20}
      };

      (updateClienteSchema.safeParse as jest.Mock).mockReturnValue({ success: true, data: mockCliente });
      (gestorPool.execute as jest.Mock).mockResolvedValue([{}]);

      const request = new NextRequest('http://localhost/api/clientes/1', {
        method: 'PUT',
        body: JSON.stringify(mockCliente),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});
