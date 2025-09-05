import { GET, POST, PUT, PATCH, DELETE } from './route';
import { NextRequest, NextResponse } from 'next/server';
import { gestorPool, executeWithRetry } from '@/lib/mysql';
import { z } from 'zod';

// Mock the entire @/lib/mysql module
jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
  executeWithRetry: jest.fn((pool, query, params) => {
    // Simulate executeWithRetry calling the mocked gestorPool.execute
    return pool.execute(query, params);
  }),
}));

// Mock the Zod schemas
jest.mock('./schema/formSchemaPretadores', () => ({
  createPrestadorSchema: {
    safeParse: jest.fn().mockReturnValue({ success: true, data: {} }),
  },
  updatePrestadorSchema: {
    safeParse: jest.fn().mockReturnValue({ success: true, data: {} }),
  },
}));

describe('API /api/prestadores', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (gestorPool.execute as jest.Mock).mockReset();
    (executeWithRetry as jest.Mock).mockReset();
  });

  // Existing GET tests (assuming they are already in the file)
  // ...

  describe('POST /api/prestadores', () => {
    it('should create a new prestador successfully with valid data', async () => {
      const mockPrestadorData = {
        nome: 'Novo Prestador',
        rg: '12.345.678-9',
        cpf: '123.456.789-00',
        sexo: 'Masculino',
        dtnascimento: '1990-01-01',
        cep: '12345-678',
        logradouro: 'Rua Teste',
        numero: '10',
        bairro: 'Bairro Teste',
        cidade: 'Cidade Teste',
        uf: 'SP',
        telefone: '(11)1234-5678',
        celular: '(11)98765-4321',
        complemento: 'Apto 1',
      };
      const mockInsertId = 101;

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{ insertId: mockInsertId }]);

      const request = new NextRequest('http://localhost/api/prestadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockPrestadorData),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true, id: mockInsertId });

      expect(gestorPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO prestadores'),
        [
          mockPrestadorData.nome,
          mockPrestadorData.rg,
          mockPrestadorData.cpf,
          mockPrestadorData.sexo,
          mockPrestadorData.dtnascimento,
          mockPrestadorData.cep,
          mockPrestadorData.logradouro,
          mockPrestadorData.numero,
          mockPrestadorData.bairro,
          mockPrestadorData.cidade,
          mockPrestadorData.uf,
          mockPrestadorData.telefone,
          mockPrestadorData.celular,
          mockPrestadorData.complemento,
          'Ativo',
        ]
      );
    });

    it('should return 400 for invalid data (validation errors)', async () => {
      const invalidData = {
        nome: 'ab', // Too short
        rg: '123', // Too short
      };

      const request = new NextRequest('http://localhost/api/prestadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Dados inválidos');
      expect(data.details.fieldErrors.nome).toBeDefined();
      expect(data.details.fieldErrors.rg).toBeDefined();
    });

    it('should handle internal server errors gracefully for POST', async () => {
      const errorMessage = 'Database error on POST prestador';
      (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const mockPrestadorData = {
        nome: 'Novo Prestador',
        rg: '12.345.678-9',
        cpf: '123.456.789-00',
        sexo: 'Masculino',
        dtnascimento: '1990-01-01',
      };

      const request = new NextRequest('http://localhost/api/prestadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockPrestadorData),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Erro interno do servidor' });
    });
  });

  describe('PUT /api/prestadores', () => {
    it('should update a prestador successfully with valid data', async () => {
      const mockUpdateData = {
        nome: 'Prestador Atualizado',
        celular: '(11)99999-8888',
      };
      const prestadorId = '1';

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]); // Mock successful update

      const request = new NextRequest(`http://localhost/api/prestadores?id=${prestadorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });

      expect(gestorPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE prestadores SET'),
        expect.arrayContaining([
          mockUpdateData.nome,
          mockUpdateData.celular,
          prestadorId,
        ])
      );
    });

    it('should return 400 if ID is missing for PUT', async () => {
      const mockUpdateData = { nome: 'Prestador Atualizado' };
      const request = new NextRequest('http://localhost/api/prestadores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'ID do prestador é obrigatório' });
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        nome: 'a', // Too short
      };
      const prestadorId = '1';

      const request = new NextRequest(`http://localhost/api/prestadores?id=${prestadorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Dados inválidos');
      expect(data.details.fieldErrors.nome).toBeDefined();
    });

    it('should handle errors gracefully for PUT', async () => {
      const errorMessage = 'Database error on PUT prestador';
      (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const mockUpdateData = { nome: 'Prestador Atualizado' };
      const prestadorId = '1';

      const request = new NextRequest(`http://localhost/api/prestadores?id=${prestadorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Erro interno do servidor' });
    });
  });

  describe('PATCH /api/prestadores', () => {
    it('should update prestador status successfully', async () => {
      const mockUpdateData = {
        status: 'Inativo',
      };
      const prestadorId = '1';

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]); // Mock successful update

      const request = new NextRequest(`http://localhost/api/prestadores?id=${prestadorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData),
      });

      const response = await PATCH(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });

      expect(gestorPool.execute).toHaveBeenCalledWith(
        'UPDATE prestadores SET status = ? WHERE id = ?',
        [mockUpdateData.status, prestadorId]
      );
    });

    it('should return 400 if ID is missing for PATCH', async () => {
      const mockUpdateData = { status: 'Inativo' };
      const request = new NextRequest('http://localhost/api/prestadores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData),
      });

      const response = await PATCH(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'ID do prestador é obrigatório' });
    });

    it('should return 400 for invalid status data', async () => {
      const invalidData = {
        status: 'InvalidStatus', // Invalid enum value
      };
      const prestadorId = '1';

      const request = new NextRequest(`http://localhost/api/prestadores?id=${prestadorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const response = await PATCH(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Dados inválidos');
      expect(data.details.fieldErrors.status).toBeDefined();
    });

    it('should handle errors gracefully for PATCH', async () => {
      const errorMessage = 'Database error on PATCH prestador';
      (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const mockUpdateData = { status: 'Inativo' };
      const prestadorId = '1';

      const request = new NextRequest(`http://localhost/api/prestadores?id=${prestadorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData),
      });

      const response = await PATCH(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Erro interno do servidor' });
    });
  });

  describe('DELETE /api/prestadores', () => {
    it('should soft delete a prestador successfully', async () => {
      const prestadorId = '1';
      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]); // Mock successful update

      const request = new NextRequest(`http://localhost/api/prestadores?id=${prestadorId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });
      expect(gestorPool.execute).toHaveBeenCalledWith(
        'UPDATE prestadores SET status = "Inativo" WHERE id = ?',
        [prestadorId]
      );
    });

    it('should return 400 if ID is missing for DELETE', async () => {
      const request = new NextRequest('http://localhost/api/prestadores', {
        method: 'DELETE',
      });

      const response = await DELETE(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'ID do prestador é obrigatório' });
    });

    it('should handle errors gracefully for DELETE', async () => {
      const errorMessage = 'Database error on DELETE prestador';
      (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const prestadorId = '1';
      const request = new NextRequest(`http://localhost/api/prestadores?id=${prestadorId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Erro interno do servidor' });
    });
  });
});