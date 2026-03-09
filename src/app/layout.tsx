import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '案件一覧',
  description: '案件とスクリプトの一覧',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
