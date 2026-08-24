/** Corporate and shop ranks used on CompanyMember.role */

export const COMPANY_RANKS = [
  'owner',
  'md',
  'gm',
  'agm',
  'dgm',
  'dm',
  'acm',
  'manager',
  'shop_owner',
  'staff'
] as const;

export type CompanyRank = (typeof COMPANY_RANKS)[number];

export const RANK_META: Record<CompanyRank, { label: string; labelBn: string; level: number }> = {
  owner: { label: 'Owner', labelBn: 'মালিক', level: 100 },
  md: { label: 'Managing Director (MD)', labelBn: 'ম্যানেজিং ডিরেক্টর (MD)', level: 90 },
  gm: { label: 'General Manager (GM)', labelBn: 'জেনারেল ম্যানেজার (GM)', level: 80 },
  agm: { label: 'Assistant GM (AGM)', labelBn: 'সহকারী জিএম (AGM)', level: 70 },
  dgm: { label: 'Deputy GM (DGM)', labelBn: 'ডেপুটি জিএম (DGM)', level: 65 },
  dm: { label: 'Deputy Manager (DM)', labelBn: 'ডেপুটি ম্যানেজার (DM)', level: 55 },
  acm: { label: 'Asst. Company Manager (ACM)', labelBn: 'সহকারী কোম্পানি ম্যানেজার (ACM)', level: 50 },
  manager: { label: 'Manager', labelBn: 'ম্যানেজার', level: 45 },
  shop_owner: { label: 'Shop Owner', labelBn: 'দোকান মালিক', level: 85 },
  staff: { label: 'Staff', labelBn: 'স্টাফ', level: 10 }
};

const JOB_POST_RANKS: CompanyRank[] = ['owner', 'md', 'gm', 'agm', 'dgm', 'dm', 'acm', 'manager', 'shop_owner'];
const SETTINGS_RANKS: CompanyRank[] = ['owner', 'md', 'gm', 'shop_owner'];
const MEMBER_RANKS: CompanyRank[] = ['owner', 'md', 'gm'];
const APP_MANAGE_RANKS: CompanyRank[] = ['owner', 'md', 'gm', 'agm', 'dgm', 'shop_owner'];
const APP_VIEW_RANKS: CompanyRank[] = ['owner', 'md', 'gm', 'agm', 'dgm', 'dm', 'acm', 'manager', 'shop_owner'];

export function isCompanyRank(value: string): value is CompanyRank {
  return (COMPANY_RANKS as readonly string[]).includes(value);
}

export function rankLevel(rank: string) {
  return isCompanyRank(rank) ? RANK_META[rank].level : 0;
}

export function canPostJobs(rank: string) {
  return JOB_POST_RANKS.includes(rank as CompanyRank);
}

export function canEditSettings(rank: string) {
  return SETTINGS_RANKS.includes(rank as CompanyRank);
}

export function canManageMembers(rank: string) {
  return MEMBER_RANKS.includes(rank as CompanyRank);
}

export function canManageApplications(rank: string) {
  return APP_MANAGE_RANKS.includes(rank as CompanyRank);
}

export function canViewApplications(rank: string) {
  return APP_VIEW_RANKS.includes(rank as CompanyRank);
}

export function permissionsForRank(rank: string): string[] {
  const perms = new Set<string>();
  if (canPostJobs(rank)) {
    perms.add('jobs.create');
    perms.add('jobs.edit');
  }
  if (canViewApplications(rank)) perms.add('applications.view');
  if (canManageApplications(rank)) perms.add('applications.edit');
  if (canEditSettings(rank)) perms.add('companies.edit');
  if (canManageMembers(rank)) perms.add('companies.members');
  return [...perms];
}
