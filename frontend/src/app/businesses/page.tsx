'use client';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { Business, Paginated } from '@/types/api';

export default function BusinessesPage() {
  const [items, setItems] = useState<Business[]>([]);
  useEffect(() => { void api.get<Paginated<Business>>('/businesses').then((data) => setItems(data.items)); }, []);
  return <main className="container section"><h1>Local business directory</h1><p>Electronics, restaurant, pharmacy, hospital, furniture, education, IT, construction, retail and more.</p><div className="grid three">{items.map((business) => <article className="card" key={business.id}><span className="badge">{business.category}</span><h3>{business.name}</h3><p>{business.description}</p><p>{business.district?.name}</p></article>)}</div></main>;
}
