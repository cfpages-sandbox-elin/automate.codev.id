import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NCA Toolkit Web Studio',
  description: 'A noob-friendly web UI for the No-Code Architects Toolkit.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
