import { describe, expect, it } from 'bun:test';
import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from './route';

describe('Dashboard Layout API Route Security', () => {
  it('GET /api/dashboard/layout returns 401 Unauthorized for unauthenticated calls', async () => {
    const req = new NextRequest('http://localhost:3000/api/dashboard/layout');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('POST /api/dashboard/layout returns 401 Unauthorized for unauthenticated calls', async () => {
    const req = new NextRequest('http://localhost:3000/api/dashboard/layout', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ id: 'kpi-revenue', size: 'small' }]
      })
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('DELETE /api/dashboard/layout returns 401 Unauthorized for unauthenticated calls', async () => {
    const req = new NextRequest('http://localhost:3000/api/dashboard/layout', {
      method: 'DELETE'
    });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });
});
