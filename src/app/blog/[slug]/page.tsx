import Link from 'next/link';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const title = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: title,
    description: `Read "${title}" — insights and guidance on remote frontend engineering careers from FrontendEngineers.com.`,
    alternates: {
      canonical: `/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const title = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://frontendengineers.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://frontendengineers.com/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": title,
        "item": `https://frontendengineers.com/blog/${slug}`
      }
    ]
  };
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="min-h-screen bg-white text-gray-700 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-sm text-gray-500">
              <li><Link href="/" className="hover:text-[#2563eb] transition-colors">Home</Link></li>
              <li aria-hidden="true" className="text-gray-400">›</li>
              <li><Link href="/blog" className="hover:text-[#2563eb] transition-colors">Blog</Link></li>
              <li aria-hidden="true" className="text-gray-400">›</li>
              <li className="text-gray-700 font-medium truncate max-w-[250px]" aria-current="page">{title}</li>
            </ol>
          </nav>

          <article className="prose prose-lg max-w-none prose-p:text-gray-700 prose-headings:text-gray-900">
            <h1 className="text-4xl font-bold mb-4 capitalize">{title}</h1>
            <time className="text-sm text-gray-600 block mb-8">Published recently</time>
            <div className="content">
              <p>This is a scaffolding template for your long-form content. You can write your guide here or fetch it from a CMS.</p>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
