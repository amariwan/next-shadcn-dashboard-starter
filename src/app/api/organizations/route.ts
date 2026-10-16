import { NextRequest, NextResponse } from 'next/server';
import { ACTIVE_ORG_COOKIE } from '@/lib/auth/organization';
import { getSessionOr401, err, toServiceErrorResponse } from './_lib';
import {
  listOrganizations,
  createOrganization as createOrgService
} from '@/features/organizations/api/server-service';
import { createOrganizationSchema } from '@/features/organizations/schemas';

export async function GET() {
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  try {
    const organizations = await listOrganizations(session.user.id);
    return NextResponse.json({ organizations });
  } catch (error) {
    return toServiceErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const body = await request.json().catch(() => null);
  const parsed = createOrganizationSchema.safeParse(body);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? 'Invalid input');
  }

  try {
    const organization = await createOrgService({
      userId: session.user.id,
      name: parsed.data.name.trim()
    });

    const res = NextResponse.json({ organization }, { status: 201 });
    res.cookies.set(ACTIVE_ORG_COOKIE, organization.id, {
      path: '/',
      sameSite: 'lax'
    });
    return res;
  } catch (error) {
    return toServiceErrorResponse(error);
  }
}
