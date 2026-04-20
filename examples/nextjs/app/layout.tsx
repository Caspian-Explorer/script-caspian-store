import type { ReactNode } from 'react';
import { Providers } from './providers';

export const metadata = {
  title: 'Caspian Store Example',
  description: 'Minimal Next.js consumer of @caspian-explorer/script-caspian-store',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
