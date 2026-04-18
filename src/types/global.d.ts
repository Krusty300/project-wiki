/// <reference types="next-pwa" />

declare module 'next-pwa' {
  import type { NextConfig } from 'next';
  
  interface PWAConfig {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
  }
  
  function withPWA(pwaConfig: PWAConfig): (nextConfig: NextConfig) => NextConfig;
  
  export = withPWA;
}
