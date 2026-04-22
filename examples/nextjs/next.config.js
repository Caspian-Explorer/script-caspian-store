/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The package is distributed as built JS, so we don't need transpilePackages.
  // If you install directly from a branch (raw src), add it here:
  // transpilePackages: ['@caspian-explorer/script-caspian-store'],
  images: {
    // Permissive default — storefront admins can paste image URLs from any
    // https host. To restrict, replace this entry with explicit per-host rules:
    //   { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    //   { protocol: 'https', hostname: 'cdn.example.com' },
    // See https://nextjs.org/docs/messages/next-image-unconfigured-host
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

module.exports = nextConfig;
