import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NexVerze Studio — AI Video Generation',
  description: 'AI video generation powered by Luma, Veo 3, and Kling with 1080x1920 Quality Lock.',
  themeColor: '#0a0a12',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0a0a12] text-slate-100 min-h-screen antialiased selection:bg-[#8b5cf6] selection:text-white">
        {children}
      </body>
    </html>
  );
}
