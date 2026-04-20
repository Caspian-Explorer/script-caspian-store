/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The package is distributed as built JS, so we don't need transpilePackages.
  // If you install directly from a branch (raw src), add it here:
  // transpilePackages: ['@caspian-explorer/script-caspian-store'],
};

module.exports = nextConfig;
