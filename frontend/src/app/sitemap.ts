import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap { const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.yourdomain.com'; return ['', '/jobs', '/companies', '/businesses', '/auth/login'].map((path) => ({ url: `${base}${path}`, lastModified: new Date() })); }
