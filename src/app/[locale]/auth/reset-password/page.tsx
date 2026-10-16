import ResetPasswordContent from './reset-password-content';

export const metadata = {
  title: 'Reset Password'
};

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return <ResetPasswordContent token={params.token} />;
}
