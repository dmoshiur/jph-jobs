/**
 * Model + relation registry for the Firestore data layer.
 *
 * This describes every collection and its relations so the Prisma-compatible
 * query engine (./orm.ts) can resolve `include`, relation filters in `where`,
 * `_count`, nested writes and ordering — entirely against Cloud Firestore.
 *
 * Relation kinds:
 *   belongsTo    — this document holds the foreign key (localField → target.id)
 *   hasOne       — the target holds the FK (target[foreignField] === this.id), single
 *   hasMany      — the target holds the FK (target[foreignField] === this.id), array
 */

export type RelationKind = 'belongsTo' | 'hasOne' | 'hasMany';

export interface Relation {
  kind: RelationKind;
  model: string; // target model key (camelCase)
  localField?: string; // for belongsTo
  foreignField?: string; // for hasOne / hasMany
}

export interface ModelDef {
  collection: string;
  relations: Record<string, Relation>;
  defaults?: Record<string, unknown>;
  timestamps?: boolean; // maintain createdAt/updatedAt
}

const rel = (
  kind: RelationKind,
  model: string,
  field: string
): Relation =>
  kind === 'belongsTo' ? { kind, model, localField: field } : { kind, model, foreignField: field };

export const MODELS: Record<string, ModelDef> = {
  user: {
    collection: 'users',
    timestamps: true,
    defaults: { status: 'PENDING' },
    relations: {
      roles: rel('hasMany', 'userRole', 'userId'),
      candidateProfile: rel('hasOne', 'candidateProfile', 'userId'),
      companyMemberships: rel('hasMany', 'companyMember', 'userId'),
      companiesOwned: rel('hasMany', 'company', 'ownerId'),
      applications: rel('hasMany', 'application', 'candidateUserId'),
      savedJobs: rel('hasMany', 'savedJob', 'userId'),
      jobAlerts: rel('hasMany', 'jobAlert', 'userId'),
      orders: rel('hasMany', 'order', 'userId'),
      payments: rel('hasMany', 'payment', 'userId'),
      notifications: rel('hasMany', 'notification', 'userId'),
      reports: rel('hasMany', 'report', 'reporterId'),
      reviews: rel('hasMany', 'review', 'userId'),
      auditLogs: rel('hasMany', 'auditLog', 'adminId')
    }
  },
  role: {
    collection: 'roles',
    timestamps: true,
    relations: {
      permissions: rel('hasMany', 'rolePermission', 'roleId'),
      users: rel('hasMany', 'userRole', 'roleId')
    }
  },
  permission: {
    collection: 'permissions',
    timestamps: true,
    relations: { roles: rel('hasMany', 'rolePermission', 'permissionId') }
  },
  userRole: {
    collection: 'user_roles',
    timestamps: true,
    relations: {
      user: rel('belongsTo', 'user', 'userId'),
      role: rel('belongsTo', 'role', 'roleId')
    }
  },
  rolePermission: {
    collection: 'role_permissions',
    timestamps: true,
    relations: {
      role: rel('belongsTo', 'role', 'roleId'),
      permission: rel('belongsTo', 'permission', 'permissionId')
    }
  },
  passwordResetToken: {
    collection: 'password_reset_tokens',
    timestamps: true,
    relations: { user: rel('belongsTo', 'user', 'userId') }
  },
  emailVerificationToken: {
    collection: 'email_verification_tokens',
    timestamps: true,
    relations: { user: rel('belongsTo', 'user', 'userId') }
  },
  candidateProfile: {
    collection: 'candidate_profiles',
    timestamps: true,
    relations: {
      user: rel('belongsTo', 'user', 'userId'),
      district: rel('belongsTo', 'location', 'districtId'),
      upazila: rel('belongsTo', 'location', 'upazilaId'),
      educations: rel('hasMany', 'candidateEducation', 'candidateId'),
      experiences: rel('hasMany', 'candidateExperience', 'candidateId'),
      skills: rel('hasMany', 'candidateSkill', 'candidateId')
    }
  },
  candidateEducation: {
    collection: 'candidate_educations',
    timestamps: true,
    relations: { candidate: rel('belongsTo', 'candidateProfile', 'candidateId') }
  },
  candidateExperience: {
    collection: 'candidate_experiences',
    timestamps: true,
    relations: { candidate: rel('belongsTo', 'candidateProfile', 'candidateId') }
  },
  skill: {
    collection: 'skills',
    timestamps: true,
    relations: {
      candidates: rel('hasMany', 'candidateSkill', 'skillId'),
      jobs: rel('hasMany', 'jobSkill', 'skillId')
    }
  },
  candidateSkill: {
    collection: 'candidate_skills',
    timestamps: true,
    relations: {
      candidate: rel('belongsTo', 'candidateProfile', 'candidateId'),
      skill: rel('belongsTo', 'skill', 'skillId')
    }
  },
  location: {
    collection: 'locations',
    timestamps: true,
    defaults: { isActive: true },
    relations: {
      parent: rel('belongsTo', 'location', 'parentId'),
      children: rel('hasMany', 'location', 'parentId'),
      districtJobs: rel('hasMany', 'job', 'districtId'),
      upazilaJobs: rel('hasMany', 'job', 'upazilaId'),
      districtCompanies: rel('hasMany', 'company', 'districtId'),
      businessesDistrict: rel('hasMany', 'businessListing', 'districtId')
    }
  },
  jobCategory: {
    collection: 'job_categories',
    timestamps: true,
    defaults: { isActive: true },
    relations: { jobs: rel('hasMany', 'job', 'categoryId') }
  },
  company: {
    collection: 'companies',
    timestamps: true,
    defaults: { verificationStatus: 'PENDING' },
    relations: {
      owner: rel('belongsTo', 'user', 'ownerId'),
      district: rel('belongsTo', 'location', 'districtId'),
      upazila: rel('belongsTo', 'location', 'upazilaId'),
      members: rel('hasMany', 'companyMember', 'companyId'),
      documents: rel('hasMany', 'companyDocument', 'companyId'),
      jobs: rel('hasMany', 'job', 'companyId'),
      reviews: rel('hasMany', 'review', 'companyId')
    }
  },
  companyMember: {
    collection: 'company_members',
    timestamps: true,
    defaults: { role: 'staff', permissions: [] },
    relations: {
      company: rel('belongsTo', 'company', 'companyId'),
      user: rel('belongsTo', 'user', 'userId')
    }
  },
  companyDocument: {
    collection: 'company_documents',
    timestamps: true,
    defaults: { status: 'PENDING' },
    relations: { company: rel('belongsTo', 'company', 'companyId') }
  },
  businessListing: {
    collection: 'businesses',
    timestamps: true,
    defaults: { isVerified: false },
    relations: {
      district: rel('belongsTo', 'location', 'districtId'),
      upazila: rel('belongsTo', 'location', 'upazilaId')
    }
  },
  job: {
    collection: 'jobs',
    timestamps: true,
    defaults: { status: 'DRAFT', views: 0, vacancy: 1 },
    relations: {
      creator: rel('belongsTo', 'user', 'creatorId'),
      company: rel('belongsTo', 'company', 'companyId'),
      category: rel('belongsTo', 'jobCategory', 'categoryId'),
      package: rel('belongsTo', 'package', 'packageId'),
      district: rel('belongsTo', 'location', 'districtId'),
      upazila: rel('belongsTo', 'location', 'upazilaId'),
      skills: rel('hasMany', 'jobSkill', 'jobId'),
      applications: rel('hasMany', 'application', 'jobId'),
      savedBy: rel('hasMany', 'savedJob', 'jobId'),
      alerts: rel('hasMany', 'jobAlert', 'jobId')
    }
  },
  jobSkill: {
    collection: 'job_skills',
    timestamps: true,
    relations: {
      job: rel('belongsTo', 'job', 'jobId'),
      skill: rel('belongsTo', 'skill', 'skillId')
    }
  },
  application: {
    collection: 'applications',
    timestamps: true,
    defaults: { status: 'SUBMITTED' },
    relations: {
      job: rel('belongsTo', 'job', 'jobId'),
      candidate: rel('belongsTo', 'user', 'candidateUserId')
    }
  },
  savedJob: {
    collection: 'saved_jobs',
    timestamps: true,
    relations: {
      user: rel('belongsTo', 'user', 'userId'),
      job: rel('belongsTo', 'job', 'jobId')
    }
  },
  jobAlert: {
    collection: 'job_alerts',
    timestamps: true,
    defaults: { frequency: 'daily', isActive: true },
    relations: {
      user: rel('belongsTo', 'user', 'userId'),
      job: rel('belongsTo', 'job', 'jobId')
    }
  },
  package: {
    collection: 'packages',
    timestamps: true,
    defaults: { currency: 'BDT', isActive: true, sortOrder: 0 },
    relations: {
      features: rel('hasMany', 'packageFeature', 'packageId'),
      jobs: rel('hasMany', 'job', 'packageId'),
      orders: rel('hasMany', 'order', 'packageId'),
      subscriptions: rel('hasMany', 'subscription', 'packageId')
    }
  },
  packageFeature: {
    collection: 'package_features',
    timestamps: true,
    relations: { package: rel('belongsTo', 'package', 'packageId') }
  },
  order: {
    collection: 'orders',
    timestamps: true,
    defaults: { status: 'PENDING', currency: 'BDT' },
    relations: {
      user: rel('belongsTo', 'user', 'userId'),
      package: rel('belongsTo', 'package', 'packageId'),
      payments: rel('hasMany', 'payment', 'orderId')
    }
  },
  payment: {
    collection: 'payments',
    timestamps: true,
    defaults: { status: 'PENDING', currency: 'BDT' },
    relations: {
      order: rel('belongsTo', 'order', 'orderId'),
      user: rel('belongsTo', 'user', 'userId'),
      invoice: rel('hasOne', 'invoice', 'paymentId')
    }
  },
  invoice: {
    collection: 'invoices',
    timestamps: true,
    defaults: { status: 'ISSUED', currency: 'BDT' },
    relations: { payment: rel('belongsTo', 'payment', 'paymentId') }
  },
  subscription: {
    collection: 'subscriptions',
    timestamps: true,
    defaults: { status: 'active' },
    relations: {
      user: rel('belongsTo', 'user', 'userId'),
      package: rel('belongsTo', 'package', 'packageId')
    }
  },
  advertisement: {
    collection: 'advertisements',
    timestamps: true,
    defaults: { status: 'DRAFT' },
    relations: { user: rel('belongsTo', 'user', 'userId') }
  },
  notification: {
    collection: 'notifications',
    timestamps: true,
    defaults: { readAt: null },
    relations: { user: rel('belongsTo', 'user', 'userId') }
  },
  report: {
    collection: 'reports',
    timestamps: true,
    defaults: { status: 'OPEN' },
    relations: { reporter: rel('belongsTo', 'user', 'reporterId') }
  },
  review: {
    collection: 'reviews',
    timestamps: true,
    defaults: { status: 'PENDING' },
    relations: {
      user: rel('belongsTo', 'user', 'userId'),
      company: rel('belongsTo', 'company', 'companyId')
    }
  },
  cmsPage: {
    collection: 'cms_pages',
    timestamps: true,
    defaults: { published: false },
    relations: { updatedBy: rel('belongsTo', 'user', 'updatedById') }
  },
  setting: {
    collection: 'settings',
    timestamps: true,
    defaults: { isSecret: false },
    relations: { updatedBy: rel('belongsTo', 'user', 'updatedById') }
  },
  auditLog: {
    collection: 'audit_logs',
    timestamps: true,
    relations: { admin: rel('belongsTo', 'user', 'adminId') }
  }
};

export type ModelName = keyof typeof MODELS;
