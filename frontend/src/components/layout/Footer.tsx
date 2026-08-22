import Link from 'next/link';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-about">
            <Link href="/" className="logo"><span className="logo-mark">JH</span> JOBHUB</Link>
            <p className="mt-2">বগুড়া ও জয়পুরহাট-এর স্থানীয় চাকরি, কোম্পানি ও ব্যবসা প্রতিষ্ঠানের বিশ্বস্ত প্ল্যাটফর্ম। স্থানীয় প্রতিভা এবং নিয়োগদাতাদের এক জায়গায় সংযুক্ত করি।</p>
            <p className="text-sm" style={{ color: '#8da2cf' }}>📍 বগুড়া, বাংলাদেশ · 📞 ০৯৬১২-xxx-xxx · ✉️ info@jobhub.test</p>
          </div>
          <div>
            <h4>প্রার্থীদের জন্য</h4>
            <Link href="/jobs">সব চাকরি</Link>
            <Link href="/jobs?type=INTERNSHIP">ইন্টার্নশিপ</Link>
            <Link href="/jobs?type=PART_TIME">পার্ট-টাইম</Link>
            <Link href="/dashboard/saved">সংরক্ষিত চাকরি</Link>
            <Link href="/dashboard/cv">সিভি তৈরি</Link>
          </div>
          <div>
            <h4>নিয়োগদাতাদের জন্য</h4>
            <Link href="/employers/post-job">চাকরি পোস্ট করুন</Link>
            <Link href="/companies">কোম্পানি তালিকা</Link>
            <Link href="/dashboard/employer">এমপ্লয়ার ড্যাশবোর্ড</Link>
            <Link href="/pricing">প্যাকেজ ও মূল্য</Link>
            <Link href="/businesses">ব্যবসা তালিকা</Link>
          </div>
          <div>
            <h4>কোম্পানি</h4>
            <Link href="/about">আমাদের সম্পর্কে</Link>
            <Link href="/contact">যোগাযোগ</Link>
            <Link href="/help">সাহায্য ও সহায়তা</Link>
            <Link href="/privacy">গোপনীয়তা নীতি</Link>
            <Link href="/terms">ব্যবহারের শর্তাবলী</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} JOBHUB। সর্বস্বত্ব সংরক্ষিত।</span>
          <span>বগুড়া · জয়পুরহাট · বাংলাদেশ</span>
        </div>
      </div>
    </footer>
  );
}
