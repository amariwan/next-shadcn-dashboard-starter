import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'About'
};

export default async function AboutPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className='min-h-screen px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-3xl'>
        {/* Header */}
        <div className='mb-12 text-center'>
          <h1 className='text-foreground text-3xl font-bold tracking-tight sm:text-4xl'>About</h1>
          <p className='text-muted-foreground mt-4 text-lg'>Learn more about this project</p>
        </div>

        {/* Content Sections */}
        <div className='space-y-8'>
          {/* Open Source Section */}
          <section className='bg-card rounded-2xl border p-8 shadow-sm'>
            <h2 className='text-foreground mb-4 text-xl font-semibold'>Open-Source Project</h2>
            <p className='text-muted-foreground text-lg leading-relaxed'>
              This is an open-source Next.js admin dashboard starter built with modern web
              technologies. It provides a solid foundation for building powerful admin interfaces
              and dashboards. The source code is freely available for developers to use, modify, and
              distribute.
            </p>
          </section>

          {/* Demo Purpose Section */}
          <section className='bg-card rounded-2xl border p-8 shadow-sm'>
            <h2 className='text-foreground mb-4 text-xl font-semibold'>Demo Purpose</h2>
            <p className='text-muted-foreground text-lg leading-relaxed'>
              This application serves as a demo for demonstration purposes. It showcases the
              features, components, and capabilities of the admin dashboard starter. Feel free to
              explore the interface, test the functionality, and evaluate if it meets your project
              requirements.
            </p>
          </section>

          {/* Auth Section */}
          <section className='bg-card rounded-2xl border p-8 shadow-sm'>
            <h2 className='text-foreground mb-4 text-xl font-semibold'>Local Authentication</h2>
            <p className='text-muted-foreground text-lg leading-relaxed'>
              Authentication for this application is handled locally using{' '}
              <a
                href='https://authjs.dev'
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary font-medium hover:underline'
              >
                Auth.js
              </a>
              , a self-hosted authentication solution. User credentials are stored in a local
              SQLite database with bcrypt password hashing, keeping everything under your control.
            </p>
          </section>

          {/* Data Privacy Section */}
          <section className='bg-card rounded-2xl border p-8 shadow-sm'>
            <h2 className='text-foreground mb-4 text-xl font-semibold'>Data Privacy</h2>
            <p className='text-muted-foreground text-lg leading-relaxed'>
              We take your privacy seriously. No personal data is misused, shared, or sold to third
              parties. Any information collected during your use of this demo application is used
              solely for the purpose of providing the demonstration experience and is handled in
              accordance with best practices for data protection.
            </p>
          </section>
        </div>

        {/* Footer Note */}
        <div className='mt-12 text-center'>
          <p className='text-muted-foreground text-sm'>
            Built with Next.js, Tailwind CSS, and shadcn/ui
          </p>
        </div>
      </div>
    </div>
  );
}
