import { GET } from './route';
import { NextRequest, NextResponse } from 'next/server';
import { gestorPool } from '@/lib/mysql';

// Mock the entire @/lib/mysql module
jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('GET /api/usuarios/test', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (gestorPool.execute as jest.Mock).mockReset();
  });

  it('should return success and database details on successful connection', async () => {
    const mockTestRows = [{ test: 1 }];
    const mockStructureRows = [{ Field: 'id', Type: 'int' }, { Field: 'nome', Type: 'varchar' }];
    const mockUserRows = [{ id: 1, nome: 'Test User 1' }, { id: 2, nome: 'Test User 2' }];

    // Mock gestorPool.execute for each call in the GET handler
    (gestorPool.execute as jest.Mock)
      .mockResolvedValueOnce([mockTestRows]) // For 'SELECT 1 as test'
      .mockResolvedValueOnce([mockStructureRows]) // For 'DESCRIBE usuarios'
      .mockResolvedValueOnce([mockUserRows]); // For 'SELECT * FROM usuarios LIMIT 5'

    const request = new NextRequest('http://localhost/api/usuarios/test');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.connection).toBe('OK');
    expect(data.structure).toEqual(mockStructureRows);
    expect(data.sampleUsers).toEqual(mockUserRows);

    expect(gestorPool.execute).toHaveBeenCalledTimes(3);
    expect(gestorPool.execute).toHaveBeenCalledWith('SELECT 1 as test');
    expect(gestorPool.execute).toHaveBeenCalledWith('DESCRIBE usuarios');
    expect(gestorPool.execute).toHaveBeenCalledWith('SELECT * FROM usuarios LIMIT 5');
  });

  it('should return an error response if database connection fails', async () => {
    const errorMessage = 'Simulated database error';
    (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    const request = new NextRequest('http://localhost/api/usuarios/test');
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe(errorMessage);
    expect(data.stack).toBeDefined(); // Stack trace should be present
  });
});
