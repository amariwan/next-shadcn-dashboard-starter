import VerifyEmailContent from './verify-email-content';

export const metadata = {
  title: 'Verify Email'
};

export default async function VerifyEmailPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return <VerifyEmailContent token={params.token} />;
}
