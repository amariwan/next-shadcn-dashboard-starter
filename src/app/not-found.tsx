import Link from 'next/link';

export default function GlobalNotFound() {
  return (
    <html lang='en'>
      <body className='flex min-h-screen flex-col items-center justify-center p-4 font-sans text-center'>
        <h1 className='text-6xl font-bold'>404</h1>
        <p className='mt-2 text-muted-foreground'>Page Not Found</p>
        <Link href='/' className='mt-4 text-primary underline'>
          Back to Home
        </Link>
      </body>
    </html>
  );
}
