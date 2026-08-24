export const COMPANY_RANKS = [
  { id: 'owner', label: 'Owner', labelBn: 'মালিক' },
  { id: 'md', label: 'Managing Director (MD)', labelBn: 'ম্যানেজিং ডিরেক্টর (MD)' },
  { id: 'gm', label: 'General Manager (GM)', labelBn: 'জেনারেল ম্যানেজার (GM)' },
  { id: 'agm', label: 'Assistant GM (AGM)', labelBn: 'সহকারী জিএম (AGM)' },
  { id: 'dgm', label: 'Deputy GM (DGM)', labelBn: 'ডেপুটি জিএম (DGM)' },
  { id: 'dm', label: 'Deputy Manager (DM)', labelBn: 'ডেপুটি ম্যানেজার (DM)' },
  { id: 'acm', label: 'Asst. Company Manager (ACM)', labelBn: 'সহকারী কোম্পানি ম্যানেজার (ACM)' },
  { id: 'manager', label: 'Manager', labelBn: 'ম্যানেজার' },
  { id: 'shop_owner', label: 'Shop Owner', labelBn: 'দোকান মালিক' },
  { id: 'staff', label: 'Staff', labelBn: 'স্টাফ' }
] as const;

export function rankLabel(id: string, bn = false) {
  const found = COMPANY_RANKS.find((r) => r.id === id);
  if (!found) return id;
  return bn ? found.labelBn : found.label;
}

export function canHire(roles: string[] = []) {
  return roles.some((r) => ['employer', 'shop-owner', 'super-admin', 'root-admin'].includes(r));
}

export function isAdminRole(roles: string[] = []) {
  return roles.some((r) => ['super-admin', 'root-admin'].includes(r));
}

export function isShopOwner(roles: string[] = []) {
  return roles.includes('shop-owner');
}
