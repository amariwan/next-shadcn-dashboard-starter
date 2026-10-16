import { describe, expect, it } from 'bun:test';
import { NextRequest } from 'next/server';
import { GET as getOrgs, POST as postOrgs } from './route';
import {
  GET as getOrg,
  PATCH as patchOrg,
  DELETE as deleteOrg
} from './[id]/route';
import {
  GET as getMembers,
  PATCH as patchMember,
  DELETE as deleteMember
} from './[id]/members/route';
import {
  GET as getInvitations,
  POST as postInvitation,
  DELETE as deleteInvitation
} from './[id]/invitations/route';
import { GET as getActive, POST as postActive } from './active/route';

describe('Organization API Routes Security (Unauthenticated Enforcement)', () => {
  const dummyParams = { params: Promise.resolve({ id: 'dummy-org-id' }) };

  it('GET /api/organizations returns 401', async () => {
    const res = await getOrgs();
    expect(res.status).toBe(401);
  });

  it('POST /api/organizations returns 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/organizations', {
      method: 'POST',
      body: JSON.stringify({ name: 'Hacked Org' })
    });
    const res = await postOrgs(req);
    expect(res.status).toBe(401);
  });

  it('GET /api/organizations/[id] returns 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/organizations/dummy-org-id');
    const res = await getOrg(req, dummyParams);
    expect(res.status).toBe(401);
  });

  it('PATCH /api/organizations/[id] returns 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/organizations/dummy-org-id', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Renamed' })
    });
    const res = await patchOrg(req, dummyParams);
    expect(res.status).toBe(401);
  });

  it('DELETE /api/organizations/[id] returns 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/organizations/dummy-org-id', {
      method: 'DELETE'
    });
    const res = await deleteOrg(req, dummyParams);
    expect(res.status).toBe(401);
  });

  it('GET /api/organizations/[id]/members returns 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/organizations/dummy-org-id/members');
    const res = await getMembers(req, dummyParams);
    expect(res.status).toBe(401);
  });

  it('PATCH /api/organizations/[id]/members returns 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/organizations/dummy-org-id/members', {
      method: 'PATCH',
      body: JSON.stringify({ userId: 'user-1', role: 'admin' })
    });
    const res = await patchMember(req, dummyParams);
    expect(res.status).toBe(401);
  });

  it('DELETE /api/organizations/[id]/members returns 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/organizations/dummy-org-id/members', {
      method: 'DELETE'
    });
    const res = await deleteMember(req, dummyParams);
    expect(res.status).toBe(401);
  });

  it('GET /api/organizations/[id]/invitations returns 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/organizations/dummy-org-id/invitations');
    const res = await getInvitations(req, dummyParams);
    expect(res.status).toBe(401);
  });

  it('POST /api/organizations/[id]/invitations returns 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/organizations/dummy-org-id/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: 'invite@example.com', role: 'member' })
    });
    const res = await postInvitation(req, dummyParams);
    expect(res.status).toBe(401);
  });

  it('DELETE /api/organizations/[id]/invitations returns 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/organizations/dummy-org-id/invitations?invitationId=123', {
      method: 'DELETE'
    });
    const res = await deleteInvitation(req, dummyParams);
    expect(res.status).toBe(401);
  });

  it('GET /api/organizations/active returns 401', async () => {
    const res = await getActive();
    expect(res.status).toBe(401);
  });

  it('POST /api/organizations/active returns 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/organizations/active', {
      method: 'POST',
      body: JSON.stringify({ orgId: 'org-1' })
    });
    const res = await postActive(req);
    expect(res.status).toBe(401);
  });
});
