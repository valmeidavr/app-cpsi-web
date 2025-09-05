import { GET } from './route';
import { NextRequest, NextResponse } from 'next/server';
import { gestorPool } from '@/lib/mysql';

// Mock the entire @/lib/mysql module
jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('GET /api/usuarios/test-search', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (gestorPool.execute as jest.Mock).mockReset();
  });

  it('should return active users without search parameter', async () => {
    const mockUsers = [
      { login: 'user1', nome: 'User One', email: 'user1@example.com', status: 'Ativo' },
      { login: 'user2', nome: 'User Two', email: 'user2@example.com', status: 'Ativo' },
    ];

    (gestorPool.execute as jest.Mock).mockResolvedValueOnce([mockUsers]);

    const request = new NextRequest('http://localhost/api/usuarios/test-search');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.usuarios).toEqual(mockUsers);
    expect(data.total).toBe(mockUsers.length);
    expect(gestorPool.execute).toHaveBeenCalledTimes(1);
    expect(gestorPool.execute).toHaveBeenCalledWith(
      'SELECT login, nome, email, status FROM usuarios WHERE status = "Ativo" ORDER BY nome ASC LIMIT 10',
      []
    );
  });

  it('should return filtered users with search parameter', async () => {
    const mockUsers = [
      { login: 'userSearch', nome: 'User Search', email: 'user.search@example.com', status: 'Ativo' },
    ];
    const mockCount = [{ total: 1 }];

    (gestorPool.execute as jest.Mock)
      .mockResolvedValueOnce([mockUsers]) // For the main query
      .mockResolvedValueOnce([mockCount]); // For the count query

    const request = new NextRequest('http://localhost/api/usuarios/test-search?search=Search');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.usuarios).toEqual(mockUsers);
    expect(data.total).toBe(mockUsers.length);

    expect(gestorPool.execute).toHaveBeenCalledTimes(2);
    expect(gestorPool.execute).toHaveBeenCalledWith(
      'SELECT login, nome, email, status FROM usuarios WHERE status = "Ativo" AND (nome LIKE ? OR email LIKE ?) ORDER BY nome ASC LIMIT 10',
      ['%Search%', '%Search%']
    );
    expect(gestorPool.execute).toHaveBeenCalledWith(
      'SELECT COUNT(*) as total FROM usuarios WHERE nome LIKE ? AND status = "Ativo"',
      ['%Search%']
    );
  });

  it('should handle errors gracefully', async () => {
    const errorMessage = 'Simulated database error during search';
    (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    const request = new NextRequest('http://localhost/api/usuarios/test-search?search=error');
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe(errorMessage);
  });
});
