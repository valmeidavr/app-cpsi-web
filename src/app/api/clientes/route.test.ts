import { POST } from './route';
import { NextRequest, NextResponse } from 'next/server';
import { gestorPool, executeWithRetry } from '@/lib/mysql';
import { TipoCliente } from '@/app/types/Cliente'; // Assuming TipoCliente is defined here or similar

// Mock the entire @/lib/mysql module
jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
  executeWithRetry: jest.fn((pool, query, params) => {
    return pool.execute(query, params);
  }),
}));

// Mock dateUtils and clearData if they perform complex logic or external calls
jest.mock('@/app/helpers/dateUtils', () => ({
  getDateOnlyUTCISO: jest.fn((date) => date.toISOString().split('T')[0]), // Simple mock for testing
}));
jest.mock('@/util/clearData', () => ({
  limparCPF: jest.fn((cpf) => cpf.replace(/\D/g, '')),
  limparCEP: jest.fn((cep) => cep.replace(/\D/g, '')),
  limparTelefone: jest.fn((tel) => tel.replace(/\D/g, '')),
}));

// Mock the schema validation
jest.mock('../shema/formSchemaCliente', () => ({
  createClienteSchema: {
    safeParse: jest.fn().mockReturnValue({ success: true, data: {} }),
  },
}));

describe('POST /api/clientes', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (gestorPool.execute as jest.Mock).mockReset();
    (executeWithRetry as jest.Mock).mockReset();
    (require('@/app/helpers/dateUtils').getDateOnlyUTCISO as jest.Mock).mockClear();
    (require('@/util/clearData').limparCPF as jest.Mock).mockClear();
    (require('@/util/clearData').limparCEP as jest.Mock).mockClear();
    (require('@/util/clearData').limparTelefone as jest.Mock).mockClear();
  });

  it('should create a new client successfully with valid data', async () => {
    const mockClienteData = {
      nome: 'João Silva',
      email: 'joao.silva@example.com',
      dtnascimento: '15/05/1990',
      sexo: 'Masculino',
      cpf: '123.456.789-00', // This CPF is invalid, but we mock validarCPF
      cep: '12345-678',
      tipo: TipoCliente.SOCIO,
      logradouro: 'Rua Exemplo',
      numero: '123',
      bairro: 'Centro',
      cidade: 'Cidade Teste',
      uf: 'SP',
      telefone1: '(11) 98765-4321',
      telefone2: '(11) 1234-5678',
      convenios: [1, 2],
      desconto: { '1': 10, '2': 5 },
    };

    // Mock the insertId for the client creation
    (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{ insertId: 101 }]);

    // Mock subsequent convenio_clientes inserts
    (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]); // For first convenio
    (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]); // For second convenio

    // Mock validarCPF to always return true for this test
    jest.mock('@/app/helpers/cpfValidator', () => ({
      validarCPF: jest.fn(() => true),
    }));

    const request = new NextRequest('http://localhost/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockClienteData),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ success: true, id: 101 });

    // Verify main client insert
    expect(gestorPool.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO clientes'),
      [
        'João Silva',
        'joao.silva@example.com',
        '12345678900', // CPF should be cleaned
        '1990-05-15', // Date should be formatted
        '12345678', // CEP should be cleaned
        'Rua Exemplo',
        'Centro',
        'Cidade Teste',
        'SP',
        '11987654321', // Telefone1 should be cleaned
        '1112345678', // Telefone2 should be cleaned
        'Ativo',
        'Masculino',
        'SOCIO',
      ]
    );

    // Verify convenio_clientes inserts
    expect(gestorPool.execute).toHaveBeenCalledWith(
      'INSERT INTO convenios_clientes (convenio_id, cliente_id, desconto) VALUES (?, ?, ?)',
      [1, 101, 10]
    );
    expect(gestorPool.execute).toHaveBeenCalledWith(
      'INSERT INTO convenios_clientes (convenio_id, cliente_id, desconto) VALUES (?, ?, ?)',
      [2, 101, 5]
    );
  });

  it('should return 400 for invalid data (missing required fields)', async () => {
    const invalidData = {
      email: 'invalid-email', // Missing nome, dtnascimento, sexo, cpf, telefone1, tipo
    };

    const request = new NextRequest('http://localhost/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Dados inválidos');
    expect(data.details).toBeDefined();
    expect(data.details.fieldErrors.nome).toBeDefined();
    expect(data.details.fieldErrors.dtnascimento).toBeDefined();
    expect(data.details.fieldErrors.sexo).toBeDefined();
    expect(data.details.fieldErrors.cpf).toBeDefined();
    expect(data.details.fieldErrors.telefone1).toBeDefined();
    expect(data.details.fieldErrors.tipo).toBeDefined();
  });

  it('should return 400 for invalid CPF format', async () => {
    const mockClienteData = {
      nome: 'João Silva',
      email: 'joao.silva@example.com',
      dtnascimento: '15/05/1990',
      sexo: 'Masculino',
      cpf: '123.456.789-0', // Invalid CPF format
      cep: '12345-678',
      tipo: TipoCliente.SOCIO,
      logradouro: 'Rua Exemplo',
      numero: '123',
      bairro: 'Centro',
      cidade: 'Cidade Teste',
      uf: 'SP',
      telefone1: '(11) 98765-4321',
      convenios: [],
      desconto: {},
    };

    const request = new NextRequest('http://localhost/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockClienteData),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Dados inválidos');
    expect(data.details.fieldErrors.cpf).toContain('Formato de CPF inválido');
  });

  it('should return 400 for invalid CPF verification digits', async () => {
    const mockClienteData = {
      nome: 'João Silva',
      email: 'joao.silva@example.com',
      dtnascimento: '15/05/1990',
      sexo: 'Masculino',
      cpf: '111.111.111-11', // Valid format, but invalid digits
      cep: '12345-678',
      tipo: TipoCliente.SOCIO,
      logradouro: 'Rua Exemplo',
      numero: '123',
      bairro: 'Centro',
      cidade: 'Cidade Teste',
      uf: 'SP',
      telefone1: '(11) 98765-4321',
      convenios: [],
      desconto: {},
    };

    // Mock validarCPF to return false for this specific test
    jest.mock('@/app/helpers/cpfValidator', () => ({
      validarCPF: jest.fn(() => false),
    }));

    const request = new NextRequest('http://localhost/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockClienteData),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Dados inválidos');
    expect(data.details.fieldErrors.cpf).toEqual(['CPF inválido - dígitos verificadores incorretos']);
  });

  it('should return 500 for an internal server error', async () => {
    // Mock the database to throw an error during client insert
    (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error('Database connection failed'));

    const mockClienteData = {
      nome: 'João Silva',
      email: 'joao.silva@example.com',
      dtnascimento: '15/05/1990',
      sexo: 'Masculino',
      cpf: '123.456.789-00',
      cep: '12345-678',
      tipo: TipoCliente.SOCIO,
      logradouro: 'Rua Exemplo',
      numero: '123',
      bairro: 'Centro',
      cidade: 'Cidade Teste',
      uf: 'SP',
      telefone1: '(11) 98765-4321',
      convenios: [],
      desconto: {},
    };

    // Mock validarCPF to always return true for this test
    jest.mock('@/app/helpers/cpfValidator', () => ({
      validarCPF: jest.fn(() => true),
    }));

    const request = new NextRequest('http://localhost/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockClienteData),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: 'Erro interno do servidor' });
  });
});
