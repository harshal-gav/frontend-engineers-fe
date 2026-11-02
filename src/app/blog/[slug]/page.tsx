import Link from 'next/link';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const rawTitle = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  
  // Format title to 50-60 chars
  let title = `${rawTitle} – Career Guide`;
  if (title.length < 50) {
    title = `${rawTitle} – Remote Career Guide`;
  }
  if (title.length > 60) {
    title = rawTitle.slice(0, 57) + '...';
  }

  // Format description to 150-160 chars
  const description = `Read "${rawTitle}" – discover proven strategies, expert advice, and practical tips to land high-paying remote frontend engineering jobs in 2026.`.slice(0, 158);

  return {
    title: title,
    description: description,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title: `${title} | FrontendEngineers.com`,
      description: description,
      type: "article",
      url: `https://www.frontendengineers.com/blog/${slug}`,
      siteName: "FrontendEngineers.com",
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | FrontendEngineers.com`,
      description: description,
      images: ["/og-image.jpg"],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const title = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Article JSON-LD with author field
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    author: {
      "@type": "Organization",
      name: "FrontendEngineers.com",
      url: "https://www.frontendengineers.com",
    },
    publisher: {
      "@type": "Organization",
      name: "FrontendEngineers.com",
      url: "https://www.frontendengineers.com",
      logo: {
        "@type": "ImageObject",
        url: "https://www.frontendengineers.com/icon.png",
      },
    },
    url: `https://www.frontendengineers.com/blog/${slug}`,
    mainEntityOfPage: `https://www.frontendengineers.com/blog/${slug}`,
    description: `Read "${title}" - insights and guidance on remote frontend engineering careers from FrontendEngineers.com.`,
  };

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.frontendengineers.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://www.frontendengineers.com/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": title,
        "item": `https://www.frontendengineers.com/blog/${slug}`
      }
    ]
  };
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
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
            <div className="flex items-center gap-3 mb-8 text-sm text-gray-600 not-prose">
              <span>By <strong>FrontendEngineers.com</strong></span>
              <span>•</span>
              <time>Published recently</time>
            </div>
            <div className="content">
              <p>This is a scaffolding template for your long-form content. You can write your guide here or fetch it from a CMS.</p>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
