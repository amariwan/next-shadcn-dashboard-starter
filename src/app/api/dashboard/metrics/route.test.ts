import { describe, expect, it } from 'bun:test';
import { NextRequest } from 'next/server';
import { GET } from './route';

describe('Dashboard Metrics API Route Security', () => {
  it('GET /api/dashboard/metrics returns 401 Unauthorized for unauthenticated requests', async () => {
    const req = new NextRequest('http://localhost:3000/api/dashboard/metrics');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
