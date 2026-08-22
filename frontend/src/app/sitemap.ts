import type { MetadataRoute } from 'next';
import { API_URL } from '@/services/api';
import type { Company, Job } from '@/types/api';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.jobhub.test';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ['', '/jobs', '/companies', '/businesses', '/pricing', '/about', '/contact', '/help', '/employers/post-job', '/auth/login', '/auth/register'];
  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({ url: `${SITE}${path}`, lastModified: new Date(), changeFrequency: 'daily', priority: path === '' ? 1 : 0.7 }));

  try {
    const [jobsRes, companiesRes] = await Promise.all([
      fetch(`${API_URL}/jobs?limit=50`, { next: { revalidate: 300 } }).then((r) => r.json()).catch(() => null),
      fetch(`${API_URL}/companies?limit=50`, { next: { revalidate: 300 } }).then((r) => r.json()).catch(() => null)
    ]);
    jobsRes?.data?.items?.forEach((j: Job) => entries.push({ url: `${SITE}/jobs/${j.slug || j.id}`, lastModified: j.publishedAt ?? j.createdAt, changeFrequency: 'weekly', priority: 0.8 }));
    companiesRes?.data?.items?.forEach((c: Company) => entries.push({ url: `${SITE}/companies/${c.slug || c.id}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 }));
  } catch { /* sitemap best-effort */ }

  return entries;
}
