'use client';

import Link from 'next/link';

export default function AlertsPage() {
  return (
    <div className="container section" style={{ maxWidth: 720 }}>
      <h1>চাকরির এলার্ট</h1>
      <p>আপনার ড্যাশবোর্ডের &quot;চাকরির এলার্ট&quot; ট্যাব থেকে কীওয়ার্ড-ভিত্তিক এলার্ট তৈরি ও পরিচালনা করতে পারবেন।</p>
      <Link href="/dashboard" className="btn">ড্যাশবোর্ডে ফিরুন</Link>
    </div>
  );
}
