import { GET } from './route';
import { NextRequest, NextResponse } from 'next/server';
import { gestorPool } from '@/lib/mysql';
import { getServerSession } from 'next-auth';

// Mock the entire @/lib/mysql module
jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

// Mock next-auth's getServerSession
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock authOptions (if needed, but for this test, we only mock getServerSession's return)
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('GET /api/auth/user-access', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (gestorPool.execute as jest.Mock).mockReset();
    (getServerSession as jest.Mock).mockReset();
  });

  it('should return 401 if user is not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null); // No session

    const response = await GET();

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: 'Usuário não autenticado' });
    expect(gestorPool.execute).not.toHaveBeenCalled(); // No database interaction
  });

  it('should return user access data when authenticated and has access', async () => {
    const mockUserId = 'testUserId123';
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: { id: mockUserId } });

    const mockSystems = [{ id: 1087, nome: 'sistemaCPSI' }];
    const mockUserAccess = [{ sistemas_id: 1087, nivel: 'Admin', sistema_nome: 'sistemaCPSI' }];

    (gestorPool.execute as jest.Mock)
      .mockResolvedValueOnce([mockSystems]) // For SELECT systems
      .mockResolvedValueOnce([mockUserAccess]); // For SELECT user_sistema

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      sistemas: mockSystems,
      userAccess: mockUserAccess,
      hasAccess: true,
      userLevel: 'Admin',
    });
    expect(gestorPool.execute).toHaveBeenCalledWith(
      'SELECT id, nome FROM sistemas WHERE nome = "sistemaCPSI"'
    );
    expect(gestorPool.execute).toHaveBeenCalledWith(
      expect.stringContaining('SELECT us.sistemas_id, us.nivel, s.nome as sistema_nome FROM usuario_sistema us INNER JOIN sistemas s ON us.sistemas_id = s.id WHERE us.usuarios_login = ? AND s.id = 1087'),
      [mockUserId]
    );
  });

  it('should return user access data when authenticated but has no access', async () => {
    const mockUserId = 'testUserId123';
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: { id: mockUserId } });

    const mockSystems = [{ id: 1087, nome: 'sistemaCPSI' }];
    const mockUserAccess: any[] = []; // No access

    (gestorPool.execute as jest.Mock)
      .mockResolvedValueOnce([mockSystems]) // For SELECT systems
      .mockResolvedValueOnce([mockUserAccess]); // For SELECT user_sistema

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      sistemas: mockSystems,
      userAccess: mockUserAccess,
      hasAccess: false,
      userLevel: null,
    });
    expect(gestorPool.execute).toHaveBeenCalledWith(
      'SELECT id, nome FROM sistemas WHERE nome = "sistemaCPSI"'
    );
    expect(gestorPool.execute).toHaveBeenCalledWith(
      expect.stringContaining('SELECT us.sistemas_id, us.nivel, s.nome as sistema_nome FROM usuario_sistema us INNER JOIN sistemas s ON us.sistemas_id = s.id WHERE us.usuarios_login = ? AND s.id = 1087'),
      [mockUserId]
    );
  });

  it('should handle errors gracefully', async () => {
    const mockUserId = 'testUserId123';
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: { id: mockUserId } });

    const errorMessage = 'Database error on GET user access';
    (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    const response = await GET();

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: 'Erro interno do servidor' });
  });
});
