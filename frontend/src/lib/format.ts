import type { Lang } from '@/i18n/copy';

export function formatSalary(
  job: { salaryMin?: number | null; salaryMax?: number | null; salaryText?: string | null },
  lang: Lang = 'en',
) {
  if (job.salaryText) return job.salaryText;
  if (job.salaryMin || job.salaryMax) {
    const locale = lang === 'bn' ? 'bn-BD' : 'en-US';
    const min = job.salaryMin ? `Tk. ${job.salaryMin.toLocaleString(locale)}` : '';
    const max = job.salaryMax ? `${job.salaryMax.toLocaleString(locale)}` : '';
    return [min, max].filter(Boolean).join(' - ') + (lang === 'bn' ? ' (মাসিক)' : ' (Monthly)');
  }
  return lang === 'bn' ? 'আলোচনা সাপেক্ষে' : 'Negotiable';
}

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export const toBn = (n: number | string) => String(n).replace(/\d/g, (d) => BANGLA_DIGITS[+d]);

export function formatBnNumber(n: number) {
  return toBn(n.toLocaleString('en-US'));
}

export function formatCount(n: number, lang: Lang = 'en') {
  return lang === 'bn' ? formatBnNumber(n) : n.toLocaleString('en-US');
}

export function timeAgo(date: string | Date, lang: Lang = 'en') {
  const d = new Date(date).getTime();
  const diff = Date.now() - d;
  const min = Math.round(diff / 60000);
  if (lang === 'bn') {
    if (min < 1) return 'এইমাত্র';
    if (min < 60) return `${toBn(min)} মিনিট আগে`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${toBn(hr)} ঘণ্টা আগে`;
    const day = Math.round(hr / 24);
    if (day < 30) return `${toBn(day)} দিন আগে`;
    const mo = Math.round(day / 30);
    if (mo < 12) return `${toBn(mo)} মাস আগে`;
    return `${toBn(Math.round(mo / 12))} বছর আগে`;
  }
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr > 1 ? 's' : ''} ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day} day${day > 1 ? 's' : ''} ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo} month${mo > 1 ? 's' : ''} ago`;
  return `${Math.round(mo / 12)} year${mo >= 24 ? 's' : ''} ago`;
}

export function formatDate(date: string | Date, lang: Lang = 'en') {
  return new Date(date).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function deadlineLabel(deadline: string | Date, lang: Lang = 'en') {
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (lang === 'bn') {
    if (days < 0) return 'মেয়াদ শেষ';
    if (days === 0) return 'আজ শেষ দিন';
    if (days === 1) return 'আগামীকাল শেষ';
    if (days <= 7) return `${toBn(days)} দিন বাকি`;
    return formatDate(deadline, 'bn');
  }
  if (days < 0) return 'Expired';
  if (days === 0) return 'Deadline today';
  if (days === 1) return 'Deadline tomorrow';
  return formatDate(deadline, 'en');
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => /[A-Za-z\u0980-\u09FF]/.test(w[0] || ''))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

export function jobTypeLabel(type: string, lang: Lang = 'en') {
  const en: Record<string, string> = {
    FULL_TIME: 'Full Time',
    PART_TIME: 'Part Time',
    INTERNSHIP: 'Internship',
    CONTRACT: 'Contractual',
    TEMPORARY: 'Temporary',
    REMOTE: 'Work From Home',
    ON_SITE: 'Work at office',
  };
  const bn: Record<string, string> = {
    FULL_TIME: 'ফুল টাইম',
    PART_TIME: 'পার্ট টাইম',
    INTERNSHIP: 'ইন্টার্নশিপ',
    CONTRACT: 'চুক্তি',
    TEMPORARY: 'অস্থায়ী',
    REMOTE: 'রিমোট',
    ON_SITE: 'অনসাইট',
  };
  return (lang === 'bn' ? bn : en)[type] ?? type;
}

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    SUBMITTED: 'জমা হয়েছে', VIEWED: 'দেখা হয়েছে', SHORTLISTED: 'শর্টলিস্টেড',
    INTERVIEW: 'ইন্টারভিউ', SELECTED: 'নির্বাচিত', REJECTED: 'প্রত্যাখ্যাত', WITHDRAWN: 'প্রত্যাহার',
    PUBLISHED: 'প্রকাশিত', APPROVED: 'অনুমোদিত', PENDING_REVIEW: 'অনুমোদনের অপেক্ষায়',
    EXPIRED: 'মেয়াদোত্তীর্ণ', CLOSED: 'বন্ধ', DRAFT: 'খসড়া',
    SUCCESS: 'সফল', PENDING: 'প্রক্রিয়াধীন', PROCESSING: 'প্রক্রিয়াধীন',
    FAILED: 'ব্যর্থ', CANCELLED: 'বাতিল', REFUNDED: 'ফেরত',
    VERIFIED: 'ভেরিফাইড', ACTIVE: 'সক্রিয়', DISABLED: 'নিষ্ক্রিয়', SUSPENDED: 'স্থগিত',
    PAID: 'পরিশোধিত', ISSUED: 'ইস্যু করা হয়েছে', RESOLVED: 'সমাধান হয়েছে',
    IN_REVIEW: 'পর্যালোচনাধীন', OPEN: 'উন্মুক্ত', APP: 'আবেদন'
  };
  return map[status] ?? status.replace(/_/g, ' ').toLowerCase();
}

export function logoColor(name: string) {
  const palette = ['#0072bc', '#0aa2c0', '#1aaa55', '#c0392b', '#8e44ad', '#d35400', '#16a085', '#2c3e50', '#2980b9', '#27ae60'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}
