export function formatSalary(job: { salaryMin?: number | null; salaryMax?: number | null; salaryText?: string | null }) {
  if (job.salaryText) return job.salaryText;
  if (job.salaryMin || job.salaryMax) {
    const min = job.salaryMin ? `৳${job.salaryMin.toLocaleString('bn-BD')}` : '';
    const max = job.salaryMax ? `৳${job.salaryMax.toLocaleString('bn-BD')}` : '';
    return [min, max].filter(Boolean).join('–');
  }
  return 'আলোচনা সাপেক্ষে';
}

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export const toBn = (n: number | string) => String(n).replace(/\d/g, (d) => BANGLA_DIGITS[+d]);

export function formatBnNumber(n: number) {
  return toBn(n.toLocaleString('en-US'));
}

export function timeAgo(date: string | Date) {
  const d = new Date(date).getTime();
  const diff = Date.now() - d;
  const min = Math.round(diff / 60000);
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

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('bn-BD', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function deadlineLabel(deadline: string | Date) {
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (days < 0) return 'মেয়াদ শেষ';
  if (days === 0) return 'আজ শেষ দিন';
  if (days === 1) return 'আগামীকাল শেষ';
  if (days <= 7) return `${toBn(days)} দিন বাকি`;
  return formatDate(deadline);
}

export function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
}

export function jobTypeLabel(type: string) {
  const map: Record<string, string> = {
    FULL_TIME: 'ফুল টাইম', PART_TIME: 'পার্ট টাইম', INTERNSHIP: 'ইন্টার্নশিপ',
    CONTRACT: 'চুক্তি', TEMPORARY: 'অস্থায়ী', REMOTE: 'রিমোট', ON_SITE: 'অনসাইট'
  };
  return map[type] ?? type;
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
