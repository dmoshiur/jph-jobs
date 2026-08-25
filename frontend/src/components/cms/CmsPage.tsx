import Link from 'next/link';

export function CmsPage({
  title,
  crumb,
  children,
}: {
  title: string;
  crumb?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container bdj-cms">
      <nav className="crumb">
        <Link href="/">Home</Link> <span>/</span> <span>{crumb || title}</span>
      </nav>
      <article className="bdj-cms-card">
        <h1>{title}</h1>
        {children}
      </article>
    </div>
  );
}
