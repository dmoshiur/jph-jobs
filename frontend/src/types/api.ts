export interface ApiSuccess<T> { success: true; message: string; data: T }
export interface ApiFailure { success: false; message: string; errors: unknown }
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface Job {
  id: string;
  title: string;
  type: string;
  salaryText?: string;
  deadline: string;
  status: string;
  views: number;
  company?: Company;
  district?: Location;
  category?: { name: string };
}

export interface Company {
  id: string;
  name: string;
  about?: string;
  category?: string;
  verificationStatus?: string;
  district?: Location;
  _count?: { jobs: number };
}

export interface Business {
  id: string;
  name: string;
  category: string;
  description?: string;
  district?: Location;
}

export interface Location { id: string; name: string; slug: string; type: string; parentId?: string }
export interface PackagePlan { id: string; name: string; slug: string; type: string; price: number; currency: string; features: { id: string; value: string }[] }
export interface Paginated<T> { items: T[]; total: number; page: number; limit: number; pages: number }
