import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Frontend Engineering Blog — Career Guides & Remote Job Tips',
  description: 'Guides, tips, and insights on remote frontend engineering, interviewing, and career growth. Published by FrontendEngineers.com.',
  alternates: {
    canonical: '/blog',
  },
};

export default function BlogIndex() {
  // Placeholder data for the blog index
  const posts = [
    {
      slug: 'how-to-get-remote-frontend-job-2026',
      title: 'How to Get a Remote Frontend Job in 2026',
      excerpt: 'A complete guide to standing out in the competitive remote frontend job market.',
      date: '2026-08-30'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-700 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-1.5 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-[#2563eb] transition-colors">Home</Link></li>
            <li aria-hidden="true" className="text-gray-400">›</li>
            <li className="text-gray-700 font-medium" aria-current="page">Blog</li>
          </ol>
        </nav>

        <h1 className="text-4xl font-bold mb-6 text-gray-900">Frontend Engineering Blog</h1>
        <p className="mb-12 text-gray-600">Guides, tips, and insights on remote frontend engineering, interviewing, and career growth.</p>
        
        <div className="space-y-8">
          {posts.map(post => (
            <article key={post.slug} className="border-b border-[#e2e2e6] pb-8">
              <Link href={`/blog/${post.slug}`} className="block group">
                <h2 className="text-2xl font-bold text-gray-900 group-hover:text-[#2563eb] transition-colors mb-2">
                  {post.title}
                </h2>
                <time className="text-sm text-gray-600 mb-3 block" dateTime={post.date}>{post.date}</time>
                <p className="text-gray-600">{post.excerpt}</p>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
