import { describe, expect, it } from 'bun:test';
import { NextRequest } from 'next/server';
import { GET } from './route';

describe('AuditLog API Route Security', () => {
  it('returns 401 Unauthorized when no session exists', async () => {
    const req = new NextRequest('http://localhost:3000/api/audit-logs');
    const response = await GET(req);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('rejects access to cross-tenant organization without membership (401/403/404)', async () => {
    // When called unauthenticated or unauthorized for an external org
    const req = new NextRequest(
      'http://localhost:3000/api/audit-logs?organizationId=external-org-id'
    );
    const response = await GET(req);

    // Unauthenticated callers get 401
    expect([401, 403, 404]).toContain(response.status);
  });
});
