import type { SessionOrganization, OrgRole } from '@/lib/auth/organization';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    role: string;
    locale?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      locale?: string | null;
      organizations: SessionOrganization[];
      activeOrgId: string | null;
      activeOrgRole: OrgRole | null;
    } & DefaultSession['user'];
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role?: string;
    locale?: string | null;
  }
}
