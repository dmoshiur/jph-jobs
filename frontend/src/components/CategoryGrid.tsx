import Link from 'next/link';
import type { Category } from '@/types/api';
import { toBn } from '@/lib/format';
import {
  IconMoney, IconChart, IconBriefcase, IconGraduation, IconBuilding, IconHeart,
  IconCog, IconStore, IconLeaf, IconUsers, IconTruck, IconFile, IconKeyboard,
  IconHeadphones, IconUserCog, IconCar, IconShield, IconShoppingBag, IconRestaurant
} from './CategoryIcons';

const ICONS: Record<string, React.ReactNode> = {
  'Accounting/Finance': <IconMoney />,
  'Marketing/Sales': <IconChart />,
  'IT/Telecommunication': <IconKeyboard />,
  'Education/Training': <IconGraduation />,
  'Engineering': <IconCog />,
  'Healthcare': <IconHeart />,
  'Production/Operation': <IconBuilding />,
  'Hospitality': <IconRestaurant />,
  'Agro': <IconLeaf />,
  'NGO/Development': <IconUsers />,
  'Supply Chain': <IconTruck />,
  'Commercial': <IconFile />,
  'Data Entry': <IconKeyboard />,
  'Customer Service': <IconHeadphones />,
  'HR/Admin': <IconUserCog />,
  'Driving': <IconCar />,
  'Security': <IconShield />,
  'Retail': <IconShoppingBag />,
  'Restaurant': <IconRestaurant />
};

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="cat-grid">
      {categories.map((c) => (
        <Link key={c.id} href={`/jobs?category=${c.slug}`} className="cat-card">
          <span className="cat-ic">{ICONS[c.name] ?? <IconBriefcase />}</span>
          <div className="cat-name">{c.name}</div>
          <div className="cat-cnt">{toBn(c.jobCount)} টি চাকরি</div>
        </Link>
      ))}
    </div>
  );
}
