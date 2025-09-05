import { GET } from './route';
import { NextRequest, NextResponse } from 'next/server';
import { gestorPool } from '@/lib/mysql';

// Mock the entire @/lib/mysql module
jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('GET /api/lancamentos/test', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (gestorPool.execute as jest.Mock).mockReset();
  });

  it('should return success and messages on successful database queries', async () => {
    const mockLancamentosStructure = [{ Field: 'id', Type: 'int' }];
    const mockUsuariosStructure = [{ Field: 'login', Type: 'varchar' }];
    const mockForeignKeys = [{ CONSTRAINT_NAME: 'fk_user', COLUMN_NAME: 'user_id' }];
    const mockLancamentosSample = [{ id: 1, valor: 100 }];
    const mockUsuariosSample = [{ login: 'user1' }];

    // Mock gestorPool.execute for each call
    (gestorPool.execute as jest.Mock)
      .mockResolvedValueOnce([mockLancamentosStructure]) // DESCRIBE lancamentos
      .mockResolvedValueOnce([mockUsuariosStructure]) // DESCRIBE usuarios
      .mockResolvedValueOnce([mockForeignKeys]) // INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      .mockResolvedValueOnce([mockLancamentosSample]) // SELECT * FROM lancamentos
      .mockResolvedValueOnce([mockUsuariosSample]); // SELECT * FROM usuarios

    const request = new NextRequest('http://localhost/api/lancamentos/test');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe('Estrutura das tabelas verificada. Verifique os logs do console.');

    expect(gestorPool.execute).toHaveBeenCalledTimes(5);
    expect(gestorPool.execute).toHaveBeenCalledWith('DESCRIBE lancamentos');
    expect(gestorPool.execute).toHaveBeenCalledWith('DESCRIBE usuarios');
    expect(gestorPool.execute).toHaveBeenCalledWith(expect.stringContaining('FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE'));
    expect(gestorPool.execute).toHaveBeenCalledWith('SELECT * FROM lancamentos LIMIT 3');
    expect(gestorPool.execute).toHaveBeenCalledWith('SELECT * FROM usuarios LIMIT 3');
  });

  it('should handle errors gracefully if any database query fails', async () => {
    const errorMessage = 'Simulated database error during test';
    // Mock any of the execute calls to fail
    (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    const request = new NextRequest('http://localhost/api/lancamentos/test');
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe(errorMessage);
  });
});
