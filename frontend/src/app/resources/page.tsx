import Link from 'next/link';
export const metadata={title:'ক্যারিয়ার রিসোর্স'};
export default function Resources(){return <div className="container section" style={{maxWidth:820}}><h1>ক্যারিয়ার রিসোর্স</h1><div className="grid grid-3">{['সিভি লেখার নিয়ম','ইন্টারভিউ প্রস্তুতি','ক্যারিয়ার গাইড'].map(t=><div key={t} className="card card-pad"><h3>{t}</h3><p>শীঘ্রই বিস্তারিত আসছে।</p></div>)}</div></div>;}
