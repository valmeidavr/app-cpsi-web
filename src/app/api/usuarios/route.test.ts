import { GET, POST, PUT } from './route';
import { NextRequest, NextResponse } from 'next/server';
import { gestorPool } from '@/lib/mysql';
import bcrypt from 'bcrypt';

// Mock the entire @/lib/mysql module
jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

// Mock the schema validation
jest.mock('../schema/formShemaUpdateUsuario', () => ({
  updateUsuarioSchema: {
    safeParse: jest.fn().mockReturnValue({ success: true, data: {} }),
  },
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
}));

describe('API /api/usuarios', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (gestorPool.execute as jest.Mock).mockReset();
    (bcrypt.hash as jest.Mock).mockClear();
  });

  describe('GET /api/usuarios', () => {
    it('should return all active users when "all" is true', async () => {
      const mockUsers = [
        { login: 'user1', nome: 'User One', email: 'user1@example.com', status: 'Ativo' },
        { login: 'user2', nome: 'User Two', email: 'user2@example.com', status: 'Ativo' },
      ];
      const mockStructure = [{ Field: 'login' }, { Field: 'nome' }];

      (gestorPool.execute as jest.Mock)
        .mockResolvedValueOnce([mockStructure]) // For DESCRIBE usuarios
        .mockResolvedValueOnce([mockUsers]); // For SELECT users

      const request = new NextRequest('http://localhost/api/usuarios?all=true');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toEqual(mockUsers);
      expect(data.pagination).toEqual({
        page: 1,
        limit: mockUsers.length,
        total: mockUsers.length,
        totalPages: 1,
      });
      expect(gestorPool.execute).toHaveBeenCalledWith('DESCRIBE usuarios');
      expect(gestorPool.execute).toHaveBeenCalledWith(
        'SELECT login, nome, email, status FROM usuarios WHERE status = "Ativo" ORDER BY nome ASC'
      );
    });

    it('should return paginated users with search filter', async () => {
      const mockUsers = [
        { login: 'userSearch', nome: 'User Search', email: 'user.search@example.com', status: 'Ativo' },
      ];
      const mockCount = [{ total: 1 }];

      (gestorPool.execute as jest.Mock)
        .mockResolvedValueOnce([mockUsers]) // For data query
        .mockResolvedValueOnce([mockCount]); // For count query

      const request = new NextRequest('http://localhost/api/usuarios?page=1&limit=10&search=Search');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toEqual(mockUsers);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
      expect(gestorPool.execute).toHaveBeenCalledWith(
        'SELECT login, nome, email, status FROM usuarios WHERE status = "Ativo" AND (nome LIKE ? OR email LIKE ?) ORDER BY nome ASC LIMIT ? OFFSET ?',
        ['%Search%', '%Search%', 10, 0]
      );
      expect(gestorPool.execute).toHaveBeenCalledWith(
        'SELECT COUNT(*) as total FROM usuarios WHERE status = "Ativo" AND (nome LIKE ? OR email LIKE ?)',
        ['%Search%', '%Search%']
      );
    });

    it('should handle errors gracefully for GET', async () => {
      const errorMessage = 'Database error on GET users';
      (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const request = new NextRequest('http://localhost/api/usuarios');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Erro interno do servidor' });
    });
  });

  describe('POST /api/usuarios', () => {
    it('should create a new user successfully with valid data', async () => {
      const mockUserData = {
        nome: 'Novo Usuário',
        email: 'novo.usuario@example.com',
        senha: 'password123',
      };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]); // Mock successful insert

      const request = new NextRequest('http://localhost/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUserData),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true, login: mockUserData.email });

      expect(bcrypt.hash).toHaveBeenCalledWith(mockUserData.senha, 10);
      expect(gestorPool.execute).toHaveBeenCalledWith(
        'INSERT INTO usuarios (login, nome, email, senha, status) VALUES (?, ?, ?, ?, ?)',
        [mockUserData.email, mockUserData.nome, mockUserData.email, `hashed_${mockUserData.senha}`, 'Ativo']
      );
    });

    it('should return 400 for invalid data (missing required fields)', async () => {
      const invalidData = {
        nome: 'Usuário Incompleto',
        // Missing email and senha
      };

      const request = new NextRequest('http://localhost/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Dados inválidos');
      expect(data.details.fieldErrors.email).toBeDefined();
      expect(data.details.fieldErrors.senha).toBeDefined();
    });

    it('should handle errors gracefully for POST', async () => {
      const errorMessage = 'Database error on POST user';
      (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const mockUserData = {
        nome: 'Novo Usuário',
        email: 'novo.usuario@example.com',
        senha: 'password123',
      };

      const request = new NextRequest('http://localhost/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUserData),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Erro interno do servidor' });
    });
  });

  describe('PUT /api/usuarios', () => {
    it('should update user name and email successfully', async () => {
      const mockUpdateData = {
        nome: 'Nome Atualizado',
        email: 'email.atualizado@example.com',
      };
      const userLogin = 'testuser@example.com';

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]); // Mock successful update

      const request = new NextRequest(`http://localhost/api/usuarios?login=${userLogin}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });

      expect(gestorPool.execute).toHaveBeenCalledWith(
        'UPDATE usuarios SET nome = ?, email = ? WHERE login = ?',
        [mockUpdateData.nome, mockUpdateData.email, userLogin]
      );
      expect(bcrypt.hash).not.toHaveBeenCalled(); // Password not updated
    });

    it('should update user password successfully', async () => {
      const mockUpdateData = {
        senha: 'newPassword123',
      };
      const userLogin = 'testuser@example.com';

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]); // Mock successful update

      const request = new NextRequest(`http://localhost/api/usuarios?login=${userLogin}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });

      expect(bcrypt.hash).toHaveBeenCalledWith(mockUpdateData.senha, 10);
      expect(gestorPool.execute).toHaveBeenCalledWith(
        'UPDATE usuarios SET senha = ? WHERE login = ?',
        [`hashed_${mockUpdateData.senha}`, userLogin]
      );
    });

    it('should return 400 if login is missing for PUT', async () => {
      const mockUpdateData = { nome: 'Nome Atualizado' };

      const request = new NextRequest('http://localhost/api/usuarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'Login é obrigatório' });
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        email: 'invalid-email', // Invalid email format
      };
      const userLogin = 'testuser@example.com';

      const request = new NextRequest(`http://localhost/api/usuarios?login=${userLogin}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Dados inválidos');
      expect(data.details.fieldErrors.email).toBeDefined();
    });

    it('should handle errors gracefully for PUT', async () => {
      const errorMessage = 'Database error on PUT user';
      (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const mockUpdateData = { nome: 'Nome Atualizado' };
      const userLogin = 'testuser@example.com';

      const request = new NextRequest(`http://localhost/api/usuarios?login=${userLogin}`, {
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
});
