// ============================================================
// Profile Service — Data Access Layer
// ============================================================
import { getOrgPrisma } from '@/lib/auth/organization';

export async function updateUser({
  userId,
  name,
  email
}: {
  userId: string;
  name: string;
  email: string;
}) {
  const prisma = getOrgPrisma();
  return prisma.user.update({
    where: { id: userId },
    data: { name, email },
    select: { id: true, name: true, email: true, role: true, image: true }
  });
}
