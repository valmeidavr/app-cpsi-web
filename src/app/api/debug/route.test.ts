
import { GET } from './route';
import { NextRequest } from 'next/server';

describe('API /api/debug', () => {
  it('should return a success message and a timestamp', async () => {
    const request = new NextRequest('http://localhost/api/debug');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('API funcionando');
    expect(body.status).toBe('success');
    expect(body.timestamp).toBeDefined();
  });
});
