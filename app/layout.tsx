import type {Metadata} from 'next';
import './globals.css';
import { I18nProvider } from '@/components/i18n-provider';

export const metadata: Metadata = {
  title: 'Project Dream Viewer',
  description: 'Project Dream Viewer',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
