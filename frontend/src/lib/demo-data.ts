import type { Category, Company, Job, Location, PublicStats, QuickLinkCounts } from '@/types/api';

export const iso = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
};

export const DEMO_STATS: PublicStats = {
  liveJobs: 6703,
  vacancies: 24130,
  companies: 3721,
  newJobs: 613,
};

export const DEMO_QUICK_LINKS: QuickLinkCounts & { companies: number; contractual: number; overseas: number } = {
  latest: 592,
  deadlineTomorrow: 700,
  internship: 68,
  partTime: 40,
  remote: 68,
  fresher: 1820,
  urgent: 94,
  verifiedCompanies: 3711,
  companies: 3711,
  contractual: 190,
  overseas: 31,
};

export const DEMO_LOCATIONS: Location[] = [
  { id: 'dhaka', name: 'Dhaka', slug: 'dhaka', type: 'DISTRICT', _count: { districtJobs: 2807 } },
  { id: 'chattogram', name: 'Chattogram', slug: 'chattogram', type: 'DISTRICT', _count: { districtJobs: 334 } },
  { id: 'rajshahi', name: 'Rajshahi', slug: 'rajshahi', type: 'DISTRICT', _count: { districtJobs: 115 } },
  { id: 'khulna', name: 'Khulna', slug: 'khulna', type: 'DISTRICT', _count: { districtJobs: 120 } },
  { id: 'sylhet', name: 'Sylhet', slug: 'sylhet', type: 'DISTRICT', _count: { districtJobs: 93 } },
  { id: 'rangpur', name: 'Rangpur', slug: 'rangpur', type: 'DISTRICT', _count: { districtJobs: 81 } },
  { id: 'mymensingh', name: 'Mymensingh', slug: 'mymensingh', type: 'DISTRICT', _count: { districtJobs: 75 } },
  { id: 'barishal', name: 'Barishal', slug: 'barishal', type: 'DISTRICT', _count: { districtJobs: 42 } },
];

export const CAT_META: Record<string, { color: string; icon: string }> = {
  'accounting-finance': { color: '#1a73e8', icon: '৳' },
  'bank-nbfi': { color: '#0b8043', icon: '🏦' },
  'supply-chain': { color: '#e37400', icon: '📦' },
  'education-training': { color: '#9334e6', icon: '🎓' },
  'engineer-architect': { color: '#d93025', icon: '⚙' },
  'garments-textile': { color: '#c2185b', icon: '🧵' },
  'hr-org': { color: '#00897b', icon: '👥' },
  'gen-mgt-admin': { color: '#3949ab', icon: '🗂' },
  'healthcare-medical': { color: '#c62828', icon: '+' },
  'production-operation': { color: '#546e7a', icon: '🏭' },
  'hospitality': { color: '#6d4c41', icon: '✈' },
  'commercial': { color: '#00838f', icon: '🧾' },
  'it-telecom': { color: '#1565c0', icon: '💻' },
  'marketing-sales': { color: '#ef6c00', icon: '📈' },
  'customer-service': { color: '#00897b', icon: '🎧' },
  'media-event': { color: '#6a1b9a', icon: '🎬' },
  'pharmaceutical': { color: '#2e7d32', icon: '💊' },
  'agro': { color: '#558b2f', icon: '🌿' },
  'ngo-development': { color: '#0277bd', icon: '🤝' },
  'research-consultancy': { color: '#455a64', icon: '🔬' },
  'receptionist-ps': { color: '#ad1457', icon: '☎' },
  'data-entry': { color: '#546e7a', icon: '⌨' },
  'design-creative': { color: '#e91e63', icon: '✦' },
  'security': { color: '#37474f', icon: '🛡' },
  'law-legal': { color: '#283593', icon: '⚖' },
  'ecommerce': { color: '#f4511e', icon: '🛒' },
  'company-secretary': { color: '#00695c', icon: '📑' },
};

export const DEMO_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Accounting/Finance', slug: 'accounting-finance', jobCount: 453 },
  { id: 'c2', name: 'Bank/Non-Bank Fin. Institution', slug: 'bank-nbfi', jobCount: 122 },
  { id: 'c3', name: 'Supply Chain/Procurement', slug: 'supply-chain', jobCount: 236 },
  { id: 'c4', name: 'Education/Training', slug: 'education-training', jobCount: 366 },
  { id: 'c5', name: 'Engineer/Architect', slug: 'engineer-architect', jobCount: 510 },
  { id: 'c6', name: 'Garments/Textile', slug: 'garments-textile', jobCount: 754 },
  { id: 'c7', name: 'HR/Org. Development', slug: 'hr-org', jobCount: 249 },
  { id: 'c8', name: 'General Management/Admin', slug: 'gen-mgt-admin', jobCount: 229 },
  { id: 'c9', name: 'Healthcare/Medical', slug: 'healthcare-medical', jobCount: 374 },
  { id: 'c10', name: 'Production/Operation', slug: 'production-operation', jobCount: 206 },
  { id: 'c11', name: 'Hospitality/ Travel/ Tourism', slug: 'hospitality', jobCount: 248 },
  { id: 'c12', name: 'Commercial', slug: 'commercial', jobCount: 97 },
  { id: 'c13', name: 'IT/Telecommunication', slug: 'it-telecom', jobCount: 318 },
  { id: 'c14', name: 'Marketing/Sales', slug: 'marketing-sales', jobCount: 1345 },
  { id: 'c15', name: 'Customer Service/Call Centre', slug: 'customer-service', jobCount: 235 },
  { id: 'c16', name: 'Media/Advertisement/Event Mgt.', slug: 'media-event', jobCount: 125 },
  { id: 'c17', name: 'Pharmaceutical', slug: 'pharmaceutical', jobCount: 108 },
  { id: 'c18', name: 'Agro (Plant/Animal/Fisheries)', slug: 'agro', jobCount: 78 },
  { id: 'c19', name: 'NGO/Development', slug: 'ngo-development', jobCount: 249 },
  { id: 'c20', name: 'Research/Consultancy', slug: 'research-consultancy', jobCount: 16 },
  { id: 'c21', name: 'Receptionist/ PS', slug: 'receptionist-ps', jobCount: 101 },
  { id: 'c22', name: 'Data Entry/Operator/BPO', slug: 'data-entry', jobCount: 53 },
  { id: 'c23', name: 'Design/Creative', slug: 'design-creative', jobCount: 168 },
  { id: 'c24', name: 'Security/Support Service', slug: 'security', jobCount: 59 },
  { id: 'c25', name: 'Law/Legal', slug: 'law-legal', jobCount: 53 },
  { id: 'c26', name: 'E-commerce/ Digital Marketing', slug: 'ecommerce', jobCount: 148 },
  { id: 'c27', name: 'Company Secretary/Regulatory affairs', slug: 'company-secretary', jobCount: 7 },
];

export const DEMO_INDUSTRIES: Category[] = [
  { id: 'i1', name: 'Agro based Industry', slug: 'agro-industry', jobCount: 279 },
  { id: 'i2', name: 'Architecture/ Engineering/ Construction', slug: 'aec', jobCount: 147 },
  { id: 'i3', name: 'Bank/ Non-Bank Fin. Institution', slug: 'bank-industry', jobCount: 127 },
  { id: 'i4', name: 'Education', slug: 'education-ind', jobCount: 269 },
  { id: 'i5', name: 'Garments/ Textile', slug: 'garments-ind', jobCount: 607 },
  { id: 'i6', name: 'Information Technology (IT)', slug: 'it-ind', jobCount: 311 },
  { id: 'i7', name: 'Pharmaceuticals', slug: 'pharma-ind', jobCount: 81 },
  { id: 'i8', name: 'Hospital/ Diagnostic Center', slug: 'hospital-ind', jobCount: 165 },
  { id: 'i9', name: 'Airline/ Travel/ Tourism', slug: 'travel-ind', jobCount: 177 },
  { id: 'i10', name: 'NGO/Development', slug: 'ngo-ind', jobCount: 195 },
  { id: 'i11', name: 'Real Estate/ Development', slug: 'real-estate', jobCount: 149 },
  { id: 'i12', name: 'Wholesale/ Retail/ Export-Import', slug: 'wholesale', jobCount: 227 },
  { id: 'i13', name: 'Telecommunication', slug: 'telecom-ind', jobCount: 47 },
  { id: 'i14', name: 'Food & Beverage Industry', slug: 'fnb', jobCount: 43 },
  { id: 'i15', name: 'E-Commerce/ F-Commerce', slug: 'ecom-ind', jobCount: 80 },
  { id: 'i16', name: 'Manufacturing (Heavy Industry)', slug: 'mfg-heavy', jobCount: 271 },
  { id: 'i17', name: 'Hotel/Restaurant', slug: 'hotel-ind', jobCount: 60 },
  { id: 'i18', name: 'Media / Advertising/ Event Mgt.', slug: 'media-ind', jobCount: 78 },
];

const L = Object.fromEntries(DEMO_LOCATIONS.map((x) => [x.slug, x]));

function co(
  id: string,
  name: string,
  slug: string,
  extra: Partial<Company> = {},
): Company {
  return {
    id,
    name,
    slug,
    verificationStatus: 'VERIFIED',
    category: extra.category ?? 'Private Firm/Company',
    district: extra.district ?? L.dhaka,
    about: extra.about ?? `${name} is a leading employer in Bangladesh.`,
    address: extra.address ?? 'Dhaka, Bangladesh',
    website: extra.website,
    phone: extra.phone ?? '02-55667788',
    email: extra.email ?? `career@${slug}.com`,
    _count: extra._count ?? { jobs: 3 },
    ...extra,
  };
}

export const DEMO_COMPANIES: Company[] = [
  co('brac', 'BRAC', 'brac', {
    category: 'NGO/Development',
    about: 'BRAC is a global leader in creating opportunity for the world’s poor. Headquartered in Dhaka.',
    website: 'https://www.brac.net',
    _count: { jobs: 8 },
  }),
  co('gp', 'Grameenphone Ltd.', 'grameenphone', {
    category: 'Telecommunication',
    about: 'Grameenphone is the leading telecommunications service provider in Bangladesh.',
    website: 'https://www.grameenphone.com',
    _count: { jobs: 5 },
  }),
  co('bkash', 'bKash Limited', 'bkash', {
    category: 'Bank/ Non-Bank Fin. Institution',
    about: 'bKash is the largest mobile financial service provider in Bangladesh.',
    website: 'https://www.bkash.com',
    _count: { jobs: 4 },
  }),
  co('square', 'Square Pharmaceuticals PLC', 'square-pharma', {
    category: 'Pharmaceuticals',
    about: 'Square Pharmaceuticals is the flagship company of Square Group.',
    website: 'https://www.squarepharma.com.bd',
    _count: { jobs: 6 },
  }),
  co('unilever', 'Unilever Bangladesh Limited', 'unilever-bd', {
    category: 'FMCG',
    about: 'Unilever Bangladesh manufactures and markets home and personal care brands.',
    website: 'https://www.unilever.com.bd',
    _count: { jobs: 3 },
  }),
  co('walton', 'Walton Hi-Tech Industries PLC', 'walton', {
    category: 'Electronics/ Consumer Durables',
    district: L.dhaka,
    about: 'Walton is Bangladesh’s leading electronics and home appliance manufacturer.',
    website: 'https://waltonbd.com',
    _count: { jobs: 7 },
  }),
  co('robi', 'Robi Axiata Limited', 'robi', {
    category: 'Telecommunication',
    about: 'Robi is a leading digital services operator in Bangladesh.',
    website: 'https://www.robi.com.bd',
    _count: { jobs: 4 },
  }),
  co('nestle', 'Nestlé Bangladesh Limited', 'nestle-bd', {
    category: 'Food & Beverage Industry',
    about: 'Nestlé Bangladesh is part of the world’s largest food and beverage company.',
    website: 'https://www.nestle.com.bd',
    _count: { jobs: 3 },
  }),
  co('bracbank', 'BRAC Bank PLC', 'brac-bank', {
    category: 'Bank/ Non-Bank Fin. Institution',
    about: 'BRAC Bank is a leading SME-focused commercial bank in Bangladesh.',
    website: 'https://www.bracbank.com',
    _count: { jobs: 5 },
  }),
  co('pathao', 'Pathao Limited', 'pathao', {
    category: 'Information Technology (IT)',
    about: 'Pathao is a technology platform for ride-sharing, delivery and payments.',
    website: 'https://pathao.com',
    _count: { jobs: 3 },
  }),
  co('aci', 'ACI Limited', 'aci', {
    category: 'Pharmaceuticals',
    about: 'ACI is one of the leading conglomerates in Bangladesh.',
    website: 'https://www.aci-bd.com',
    _count: { jobs: 4 },
  }),
  co('pran', 'PRAN-RFL Group', 'pran-rfl', {
    category: 'Food & Beverage Industry',
    about: 'PRAN-RFL is one of the largest local conglomerates in Bangladesh.',
    website: 'https://www.pranfoods.net',
    _count: { jobs: 6 },
  }),
  co('bgpsc', 'Border Guard Public School & College, Rangpur', 'bgpsc-rangpur', {
    category: 'Education',
    district: L.rangpur,
    verificationStatus: 'VERIFIED',
    about: 'A reputed English version school and college in Rangpur.',
    _count: { jobs: 2 },
  }),
  co('chec', 'China Harbour Engineering Co. Ltd. (CHEC)', 'chec', {
    category: 'Architecture/ Engineering/ Construction',
    about: 'CHEC is a global infrastructure contractor with projects in Bangladesh.',
    _count: { jobs: 2 },
  }),
  co('ilo', 'International Labour Organization (ILO)', 'ilo', {
    category: 'International Agencies',
    about: 'The ILO is a United Nations agency advancing social justice and decent work.',
    website: 'https://www.ilo.org',
    _count: { jobs: 2 },
  }),
];

const cat = (slug: string) => DEMO_CATEGORIES.find((c) => c.slug === slug) ?? DEMO_CATEGORIES[0];

function jb(partial: Partial<Job> & Pick<Job, 'id' | 'title' | 'slug' | 'company'>): Job {
  const company = partial.company!;
  return {
    type: 'FULL_TIME',
    vacancy: 1,
    status: 'PUBLISHED',
    views: 240,
    responsibilities:
      '• Execute assigned duties with accuracy and professionalism.\n• Coordinate with internal teams and external stakeholders.\n• Prepare reports and maintain documentation as required.\n• Follow company policies, compliance and workplace safety guidelines.',
    requirements:
      '• Graduate in a relevant discipline from a reputed university.\n• Strong communication skills in English and Bangla.\n• Proficiency in MS Office / relevant tools.\n• Ability to work under pressure and meet deadlines.',
    benefits: 'Festival bonus, contributory PF, health insurance, and other benefits as per company policy.',
    education: 'Bachelor degree in any discipline',
    experience: '1 to 3 years',
    createdAt: iso(-2),
    publishedAt: iso(-2),
    deadline: iso(18),
    salaryText: 'Negotiable',
    tier: 'FREE',
    district: company.district ?? L.dhaka,
    ...partial,
  };
}

export const DEMO_JOBS: Job[] = [
  jb({
    id: 'j-brac-sec',
    title: 'Officer, Security; Security Service Department',
    slug: 'officer-security-brac',
    company: DEMO_COMPANIES[0],
    category: cat('security'),
    tier: 'HOT',
    experience: '2 to 4 years',
    vacancy: 3,
    deadline: iso(12),
    publishedAt: iso(-1),
  }),
  jb({
    id: 'j-gp-se',
    title: 'Software Engineer - Digital Services',
    slug: 'software-engineer-grameenphone',
    company: DEMO_COMPANIES[1],
    category: cat('it-telecom'),
    tier: 'FEATURED',
    experience: '3 to 6 years',
    salaryMin: 80000,
    salaryMax: 140000,
    salaryText: 'Tk. 80,000 - 140,000 (Monthly)',
    deadline: iso(21),
  }),
  jb({
    id: 'j-bkash-am',
    title: 'Assistant Manager - Agent Network',
    slug: 'assistant-manager-agent-network-bkash',
    company: DEMO_COMPANIES[2],
    category: cat('marketing-sales'),
    tier: 'FEATURED',
    experience: '4 to 7 years',
    district: L.chattogram,
    deadline: iso(16),
  }),
  jb({
    id: 'j-sq-mio',
    title: 'Medical Information Officer',
    slug: 'medical-information-officer-square',
    company: DEMO_COMPANIES[3],
    category: cat('pharmaceutical'),
    experience: '0 to 2 years',
    vacancy: 12,
    salaryText: 'Tk. 25,000 - 35,000 (Monthly)',
    deadline: iso(25),
  }),
  jb({
    id: 'j-uni-tsm',
    title: 'Territory Sales Manager',
    slug: 'territory-sales-manager-unilever',
    company: DEMO_COMPANIES[4],
    category: cat('marketing-sales'),
    tier: 'HOT',
    experience: '5 to 8 years',
    district: L.rajshahi,
    deadline: iso(9),
  }),
  jb({
    id: 'j-walton-me',
    title: 'Mechanical Engineer - Production',
    slug: 'mechanical-engineer-walton',
    company: DEMO_COMPANIES[5],
    category: cat('engineer-architect'),
    experience: '2 to 5 years',
    vacancy: 4,
    deadline: iso(20),
  }),
  jb({
    id: 'j-robi-cx',
    title: 'Specialist, Customer Experience',
    slug: 'specialist-cx-robi',
    company: DEMO_COMPANIES[6],
    category: cat('customer-service'),
    experience: '3 to 5 years',
    deadline: iso(14),
  }),
  jb({
    id: 'j-nestle-qa',
    title: 'Quality Assurance Executive',
    slug: 'qa-executive-nestle',
    company: DEMO_COMPANIES[7],
    category: cat('production-operation'),
    experience: '1 to 3 years',
    deadline: iso(22),
  }),
  jb({
    id: 'j-bb-rm',
    title: 'Relationship Manager - SME',
    slug: 'relationship-manager-sme-brac-bank',
    company: DEMO_COMPANIES[8],
    category: cat('bank-nbfi'),
    tier: 'FEATURED',
    experience: '3 to 6 years',
    vacancy: 8,
    deadline: iso(11),
  }),
  jb({
    id: 'j-pathao-fe',
    title: 'Frontend Engineer (React)',
    slug: 'frontend-engineer-pathao',
    company: DEMO_COMPANIES[9],
    category: cat('it-telecom'),
    type: 'FULL_TIME',
    experience: '2 to 4 years',
    salaryText: 'Negotiable',
    deadline: iso(19),
  }),
  jb({
    id: 'j-aci-fin',
    title: 'Executive - Finance',
    slug: 'executive-finance-aci',
    company: DEMO_COMPANIES[10],
    category: cat('accounting-finance'),
    experience: '1 to 3 years',
    deadline: iso(17),
  }),
  jb({
    id: 'j-pran-hr',
    title: 'Senior Officer - Human Resources',
    slug: 'senior-officer-hr-pran',
    company: DEMO_COMPANIES[11],
    category: cat('hr-org'),
    district: L.mymensingh,
    experience: '3 to 5 years',
    deadline: iso(13),
  }),
  jb({
    id: 'j-bg-teacher',
    title: 'সহকারী শিক্ষক - ইংরেজি/ বাংলা (পুনঃবিজ্ঞপ্তি)',
    slug: 'assistant-teacher-english-bangla-bgpsc',
    company: DEMO_COMPANIES[12],
    category: cat('education-training'),
    district: L.rangpur,
    experience: 'N/A',
    education: 'Honours / Masters',
    deadline: iso(6),
    publishedAt: iso(-4),
  }),
  jb({
    id: 'j-chec-dpm',
    title: 'Deputy Project Manager / Construction Manager',
    slug: 'deputy-project-manager-chec',
    company: DEMO_COMPANIES[13],
    category: cat('engineer-architect'),
    tier: 'FEATURED',
    experience: '8 to 12 years',
    deadline: iso(28),
  }),
  jb({
    id: 'j-ilo-npo',
    title: 'National Programme Officer – Private Sector Engagement',
    slug: 'npo-private-sector-ilo',
    company: DEMO_COMPANIES[14],
    category: cat('ngo-development'),
    tier: 'HOT',
    experience: '5 to 8 years',
    deadline: iso(15),
  }),
  jb({
    id: 'j-gp-intern',
    title: 'Internship Opportunity - Technology Division',
    slug: 'internship-technology-grameenphone',
    company: DEMO_COMPANIES[1],
    category: cat('it-telecom'),
    type: 'INTERNSHIP',
    experience: 'Freshers are encouraged to apply',
    vacancy: 10,
    deadline: iso(10),
  }),
  jb({
    id: 'j-pathao-pt',
    title: 'Part-time Content Moderator',
    slug: 'part-time-content-moderator-pathao',
    company: DEMO_COMPANIES[9],
    category: cat('media-event'),
    type: 'PART_TIME',
    experience: '0 to 1 year',
    deadline: iso(8),
  }),
  jb({
    id: 'j-bkash-wfh',
    title: 'Work From Home - Tele Sales Executive',
    slug: 'wfh-telesales-bkash',
    company: DEMO_COMPANIES[2],
    category: cat('marketing-sales'),
    type: 'REMOTE',
    experience: '1 to 2 years',
    vacancy: 20,
    deadline: iso(7),
  }),
  jb({
    id: 'j-sq-acc',
    title: 'Manager - Accounts & Finance',
    slug: 'manager-accounts-finance-square',
    company: DEMO_COMPANIES[3],
    category: cat('accounting-finance'),
    experience: '7 to 10 years',
    deadline: iso(24),
  }),
  jb({
    id: 'j-uni-gd',
    title: 'Graphic Designer',
    slug: 'graphic-designer-unilever',
    company: DEMO_COMPANIES[4],
    category: cat('design-creative'),
    experience: '2 to 4 years',
    deadline: iso(1),
  }),
];

export const DEMO_GOVT_JOBS: Job[] = [
  jb({
    id: 'g-cmh',
    title: 'চিকিৎসা বিশেষজ্ঞ',
    slug: 'medical-specialist-cmh-barishal',
    company: co('cmh', 'সম্মিলিত সামরিক হাসপাতাল, বরিশাল', 'cmh-barishal', { district: L.barishal, category: 'Govt./ Semi-Govt./ Autonomous' }),
    category: cat('healthcare-medical'),
    deadline: iso(20),
  }),
  jb({
    id: 'g-just',
    title: 'অধ্যাপক',
    slug: 'professor-just',
    company: co('just', 'যশোর বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়', 'just', { district: L.khulna, category: 'Education' }),
    category: cat('education-training'),
  }),
  jb({
    id: 'g-iu',
    title: 'সহযোগী অধ্যাপক, ল্যান্ড অ্যাডমিনিস্ট্রেশন',
    slug: 'associate-professor-iu',
    company: co('iu', 'ইসলামী বিশ্ববিদ্যালয়, কুষ্টিয়া', 'iu-kushtia', { district: L.khulna, category: 'Education' }),
    category: cat('education-training'),
  }),
  jb({
    id: 'g-sust',
    title: 'সহকারী অধ্যাপক, ইন্ডাস্ট্রিয়াল অ্যান্ড প্রডাকশন ইঞ্জিনিয়ারিং',
    slug: 'assistant-professor-sust',
    company: co('sust', 'শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়, সিলেট', 'sust', { district: L.sylhet, category: 'Education' }),
    category: cat('engineer-architect'),
  }),
  jb({
    id: 'g-jnu',
    title: 'প্রভাষক, আধুনিক ভাষা ইনস্টিটিউট',
    slug: 'lecturer-jnu',
    company: co('jnu', 'জগন্নাথ বিশ্ববিদ্যালয়', 'jnu', { category: 'Education' }),
    category: cat('education-training'),
  }),
  jb({
    id: 'g-wasa',
    title: 'সহকারী প্রকৌশলী',
    slug: 'assistant-engineer-ctg-wasa',
    company: co('ctgwasa', 'চট্টগ্রাম পানি সরবরাহ ও পয়ঃনিষ্কাশন কর্তৃপক্ষ', 'ctg-wasa', { district: L.chattogram, category: 'Govt./ Semi-Govt./ Autonomous' }),
    category: cat('engineer-architect'),
  }),
];

export const DEMO_OVERSEAS: Job[] = [
  jb({
    id: 'o-sa-mech',
    title: 'Mechanical Maintenance Technician (Al Babtain biscuit factory, Saudi Arabia)',
    slug: 'mechanical-maintenance-saudi',
    company: co('greenland', 'Greenland Group.', 'greenland-group', { category: 'Overseas Recruitment' }),
    category: cat('engineer-architect'),
    experience: '3 to 6 years',
    deadline: iso(30),
  }),
  jb({
    id: 'o-jp-const',
    title: 'জাপানে কন্সট্রাকশন সেক্টরে চাকুরীর সুবর্ণ সুযোগ',
    slug: 'construction-japan-km',
    company: co('kmint', 'M/S KM International', 'km-international', { category: 'Overseas Recruitment' }),
    category: cat('engineer-architect'),
  }),
  jb({
    id: 'o-sa-kfc',
    title: 'Restaurant Worker (সৌদি আরবের KFC কোম্পানিতে)',
    slug: 'restaurant-worker-kfc-saudi',
    company: co('jsk', 'JSK Group', 'jsk-group', { category: 'Overseas Recruitment' }),
    category: cat('hospitality'),
    vacancy: 25,
  }),
  jb({
    id: 'o-sa-house',
    title: 'Housekeeping Staff (সৌদি আরবের Enaya Group Hotel)',
    slug: 'housekeeping-enaya-saudi',
    company: co('jsk2', 'JSK Group', 'jsk-group-hk', { category: 'Overseas Recruitment' }),
    category: cat('hospitality'),
  }),
  jb({
    id: 'o-my-nurse',
    title: 'Staff Nurse',
    slug: 'staff-nurse-overseas',
    company: co('irving', 'IRVING ENTERPRISE', 'irving-enterprise', { category: 'Overseas Recruitment' }),
    category: cat('healthcare-medical'),
  }),
];

export const DEMO_OVERSEAS_COUNTRIES = [
  { name: 'Saudi Arabia', count: 20, flag: '🇸🇦' },
  { name: 'Malaysia', count: 5, flag: '🇲🇾' },
  { name: 'Japan', count: 3, flag: '🇯🇵' },
  { name: 'United Arab Emirates', count: 3, flag: '🇦🇪' },
  { name: 'South Korea', count: 2, flag: '🇰🇷' },
  { name: 'India', count: 2, flag: '🇮🇳' },
  { name: 'Vietnam', count: 2, flag: '🇻🇳' },
  { name: 'Qatar', count: 1, flag: '🇶🇦' },
];

export const DEMO_COURSES = [
  { title: 'Internal Auditor Certificate Course on Compliance Management', price: '3000 BDT', instructor: 'Joyshree Das' },
  { title: 'Good Manufacturing Practices (GMP)', price: '2500 BDT', instructor: 'Joyshree Das' },
  { title: 'Lean Six Sigma-Yellow Belt', price: '3500 BDT', instructor: 'Engr. Md. Towhid Ul Alam Chowdhury' },
  { title: 'Impact-based Effective Report Writing', price: '2000 BDT', instructor: 'Bdjobs Training' },
];

export function findDemoJob(id: string): Job | undefined {
  const all = [...DEMO_JOBS, ...DEMO_GOVT_JOBS, ...DEMO_OVERSEAS];
  return all.find((j) => j.id === id || j.slug === id);
}

export function findDemoCompany(id: string): Company | undefined {
  const fromList = DEMO_COMPANIES.find((c) => c.id === id || c.slug === id);
  if (fromList) {
    return { ...fromList, jobs: DEMO_JOBS.filter((j) => j.company?.id === fromList.id || j.company?.slug === fromList.slug) };
  }
  const fromJob = [...DEMO_JOBS, ...DEMO_GOVT_JOBS, ...DEMO_OVERSEAS].find((j) => j.company?.id === id || j.company?.slug === id);
  if (fromJob?.company) {
    return { ...fromJob.company, jobs: [fromJob] };
  }
  return undefined;
}

export function filterDemoJobs(filters: {
  q?: string;
  location?: string;
  category?: string;
  type?: string;
  sort?: string;
  featured?: string;
  hot?: string;
  page?: number;
  limit?: number;
}) {
  let items = [...DEMO_JOBS, ...DEMO_GOVT_JOBS, ...DEMO_OVERSEAS];
  const q = filters.q?.trim().toLowerCase();
  if (q) {
    items = items.filter((j) =>
      [j.title, j.company?.name, j.category?.name, j.responsibilities].some((x) => x?.toLowerCase().includes(q)),
    );
  }
  const loc = filters.location;
  if (loc && loc !== '-2') {
    const needle = loc.toLowerCase();
    items = items.filter((j) => j.district?.slug === loc || j.district?.name.toLowerCase() === needle);
  }
  if (loc === '-2') items = [...DEMO_OVERSEAS];
  if (filters.category) {
    items = items.filter((j) => j.category?.slug === filters.category);
  }
  if (filters.type === 'govt') items = [...DEMO_GOVT_JOBS];
  else if (filters.type) items = items.filter((j) => j.type === filters.type);
  if (filters.featured === 'true') items = items.filter((j) => j.tier === 'FEATURED' || j.tier === 'HOT');
  if (filters.hot === 'true') items = items.filter((j) => j.tier === 'HOT');
  if (filters.sort === 'deadline') items.sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline));
  else items.sort((a, b) => +new Date(b.publishedAt || b.createdAt) - +new Date(a.publishedAt || a.createdAt));

  const page = filters.page || 1;
  const limit = filters.limit || 12;
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  return { items: items.slice((page - 1) * limit, page * limit), total, page, limit, pages };
}

export function vacanciesOf(jobs: Job[]) {
  return jobs.reduce((n, j) => n + (j.vacancy || 1), 0);
}
