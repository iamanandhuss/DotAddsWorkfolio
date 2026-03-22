import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DOT ADS — Employee Management System',
  description: 'Internal employee management platform for DOT ADS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
