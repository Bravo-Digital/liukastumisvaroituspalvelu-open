// next.config.ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  experimental: {
    // Next 15.x: ensure these native-ish deps are required at runtime, not bundled weirdly
    serverComponentsExternalPackages: ['pdfkit', 'fontkit'],
  },
};

export default withNextIntl(nextConfig);
