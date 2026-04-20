'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  CaspianStoreProvider,
  type CaspianLinkProps,
  type CaspianImageProps,
} from '@caspian-explorer/script-caspian-store';
import '@caspian-explorer/script-caspian-store/styles.css';

// Adapter: expose next/link through the Caspian contract.
function CaspianNextLink({ href, children, ...rest }: CaspianLinkProps) {
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}

// Adapter: expose next/image through the Caspian contract.
function CaspianNextImage({ src, alt, width, height, fill, priority, className, sizes }: CaspianImageProps) {
  if (fill) {
    return <Image src={src} alt={alt} fill priority={priority} className={className} sizes={sizes} />;
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 600}
      height={height ?? 400}
      priority={priority}
      className={className}
      sizes={sizes}
    />
  );
}

function useCaspianNextNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  return {
    pathname: pathname ?? '/',
    push: (href: string) => router.push(href),
    replace: (href: string) => router.replace(href),
    back: () => router.back(),
  };
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CaspianStoreProvider
      firebaseConfig={firebaseConfig}
      adapters={{
        Link: CaspianNextLink,
        Image: CaspianNextImage,
        useNavigation: useCaspianNextNavigation,
      }}
    >
      {children}
    </CaspianStoreProvider>
  );
}
