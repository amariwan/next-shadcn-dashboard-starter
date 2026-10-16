import type { SessionOrganization, OrgRole } from '@/lib/auth/organization';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    role: string;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      organizations: SessionOrganization[];
      activeOrgId: string | null;
      activeOrgRole: OrgRole | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
  }
}
