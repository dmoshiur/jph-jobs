export interface ApiSuccess<T> { success: true; message: string; data: T }
export interface ApiFailure { success: false; message: string; errors: unknown }
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status?: string;
  roles: string[];
  permissions: string[];
}

export interface Location {
  id: string;
  name: string;
  slug: string;
  type: string;
  parentId?: string | null;
  children?: Location[];
  _count?: { districtJobs?: number };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  jobCount: number;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  about?: string | null;
  category?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  verificationStatus: string;
  district?: Location | null;
  upazila?: Location | null;
  logoObjectKey?: string | null;
  jobs?: Job[];
  _count?: { jobs: number };
}

export interface Job {
  id: string;
  title: string;
  slug: string;
  type: string;
  vacancy: number;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryText?: string | null;
  experience?: string | null;
  education?: string | null;
  responsibilities: string;
  requirements: string;
  benefits?: string | null;
  deadline: string;
  expiresAt?: string | null;
  status: string;
  views: number;
  tier?: 'FREE' | 'BASIC' | 'FEATURED' | 'HOT';
  createdAt: string;
  publishedAt?: string | null;
  company?: Company;
  companyId?: string;
  district?: Location | null;
  upazila?: Location | null;
  category?: { id: string; name: string; slug: string } | null;
  package?: { id: string; name: string; slug: string; features?: { key: string; value: string }[] } | null;
  skills?: { skill: { id: string; name: string } }[];
  _count?: { applications?: number };
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  isVerified: boolean;
  district?: Location | null;
}

export interface Application {
  id: string;
  jobId: string;
  candidateUserId: string;
  coverLetter?: string | null;
  cvObjectKey?: string | null;
  status: string;
  createdAt: string;
  job?: Job;
  candidate?: { id: string; name: string; email: string; phone?: string | null; candidateProfile?: { title?: string | null } };
}

export interface PackagePlan {
  id: string;
  name: string;
  slug: string;
  type: string;
  price: number;
  currency: string;
  durationDays?: number | null;
  features?: { id: string; key: string; value: string }[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PublicStats {
  liveJobs: number;
  vacancies: number;
  companies: number;
  newJobs: number;
}

export interface QuickLinkCounts {
  latest: number;
  deadlineTomorrow: number;
  internship: number;
  partTime: number;
  remote: number;
  fresher: number;
  urgent: number;
  verifiedCompanies: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
}
