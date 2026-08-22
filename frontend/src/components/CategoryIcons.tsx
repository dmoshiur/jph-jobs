import type { SVGProps } from 'react';

const p = (props: SVGProps<SVGSVGElement>) => ({
  width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  ...props
});

export const IconMoney = (x: SVGProps<SVGSVGElement>) => (<svg {...p(x)}><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>);
export const IconChart = (x: SVGProps<SVGSVGElement>) => (<svg {...p(x)}><path d="M3 3v18h18" /><path d="M7 16V9M12 16V5M17 16v-4" /></svg>);
export const IconKeyboard = (x: SVGProps<SVGSVGElement>) => (<svg {...p(x)}><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M10 14h4" /></svg>);
export const IconHeadphones = (x: SVGProps<SVGSVGElement>) => (<svg {...p(x)}><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z" /></svg>);
export const IconUserCog = (x: SVGProps<SVGSVGElement>) => (<svg {...p(x)}><circle cx="9" cy="8" r="4" /><path d="M3 21v-1a6 6 0 0 1 12 0v1" /><circle cx="18" cy="5" r="3" /><path d="M18 8v1M18 1v1M21 5h-1M16 5h-1" /></svg>);
export const IconCar = (x: SVGProps<SVGSVGElement>) => (<svg {...p(x)}><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" /><circle cx="6.5" cy="16.5" r="2.5" /><circle cx="16.5" cy="16.5" r="2.5" /></svg>);
export const IconShield = (x: SVGProps<SVGSVGElement>) => (<svg {...p(x)}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>);
export const IconShoppingBag = (x: SVGProps<SVGSVGElement>) => (<svg {...p(x)}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18M16 10a4 4 0 0 1-8 0" /></svg>);
export const IconLeaf = (x: SVGProps<SVGSVGElement>) => (<svg {...p(x)}><path d="M11 20A7 7 0 0 1 4 13c0-6 7-11 17-11 0 10-5 17-10 18z" /><path d="M2 22c4-4 6-7 8-10" /></svg>);
export const IconTruck = (x: SVGProps<SVGSVGElement>) => (<svg {...p(x)}><path d="M10 17h4V5H2v12h3" /><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg>);
export const IconFile = (x: SVGProps<SVGSVGElement>) => (<svg {...p(x)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>);
export const IconRestaurant = (x: SVGProps<SVGSVGElement>) => (<svg {...p(x)}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" /></svg>);
export const IconBriefcase = (x: SVGProps<SVGSVGElement>) => (<svg {...p(x)}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>);
export const IconGraduation = (x: SVGProps<SVGSVGElement>) => (<svg {...p(x)}><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>);
export const IconBuilding = (x: SVGProps<SVGSVGElement>) => (<svg {...p(x)}><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4M9 6h.01M15 6h.01M9 10h.01M15 10h.01M9 14h.01M15 14h.01" /></svg>);
export const IconHeart = (x: SVGProps<SVGSVGElement>) => (<svg {...p(x)}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>);
export const IconCog = (x: SVGProps<SVGSVGElement>) => (<svg {...p(x)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>);
export const IconStore = (x: SVGProps<SVGSVGElement>) => (<svg {...p(x)}><path d="m2 7 4.4-4.4a2 2 0 0 1 2.8 0L13 7M2 7v13a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V7M2 7h20M5 21v-8h14v8" /></svg>);
export const IconUsers = (x: SVGProps<SVGSVGElement>) => (<svg {...p(x)}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>);
