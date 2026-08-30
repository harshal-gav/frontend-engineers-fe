import Link from 'next/link';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Blog Post: ${slug}`,
    description: 'Read the latest insights on FrontendEngineers.com blog.',
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Scaffolding for blog post content
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/blog" className="text-[#00ffcc] hover:underline mb-8 inline-block">
          &larr; Back to Blog
        </Link>
        <article className="prose prose-invert prose-p:text-gray-400 prose-headings:text-white max-w-none">
          <h1 className="text-4xl font-bold mb-4 capitalize">{slug.replace(/-/g, ' ')}</h1>
          <time className="text-sm text-gray-500 block mb-8">Published recently</time>
          <div className="content">
            <p>This is a scaffolding template for your long-form content. You can write your guide here or fetch it from a CMS.</p>
          </div>
        </article>
      </div>
    </div>
  );
}
