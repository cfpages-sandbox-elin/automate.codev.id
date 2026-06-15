import type { Metadata } from 'next';
import { ClientProviders } from './ClientProviders';
import './globals.css';

export const metadata: Metadata = {
  title: 'Automate Studio',
  description: 'Turn media links into transcripts, clips, thumbnails, MP3 files, and useful file details.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><ClientProviders>{children}</ClientProviders></body>
    </html>
  );
}
