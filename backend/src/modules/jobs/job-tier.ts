export type JobTier = 'FREE' | 'BASIC' | 'FEATURED' | 'HOT';

interface TierPackage {
  slug?: string;
  features?: { key: string; value: string }[];
}

/**
 * Resolve the display tier of a job from its purchased package.
 * Falls back gracefully when no package is linked (free job).
 */
export function resolveTier(pkg?: TierPackage | null): JobTier {
  if (!pkg) return 'FREE';
  const slug = (pkg.slug ?? '').toUpperCase();
  if (slug.includes('HOT') || slug.includes('URGENT')) return 'HOT';
  if (slug.includes('FEATURED')) return 'FEATURED';
  if (slug.includes('BASIC')) return 'BASIC';
  const featureTier = pkg.features?.find((f: { key: string; value: string }) => f.key === 'tier')?.value?.toUpperCase();
  if (featureTier === 'HOT') return 'HOT';
  if (featureTier === 'FEATURED') return 'FEATURED';
  if (featureTier === 'BASIC') return 'BASIC';
  return 'FREE';
}

export function isFeatured(job: { package?: TierPackage | null }) {
  const tier = resolveTier(job.package);
  return tier === 'FEATURED' || tier === 'HOT';
}

export function isHot(job: { package?: TierPackage | null }) {
  return resolveTier(job.package) === 'HOT';
}
