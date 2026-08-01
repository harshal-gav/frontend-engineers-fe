'use client';

import { useState } from 'react';
import { projects } from '@/data/projects';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';

const PortfolioGrid = () => {
  const [filter, setFilter] = useState('All');
  
  const industries = ['All', ...new Set(projects.map(p => p.industry))];
  
  const filteredProjects = filter === 'All' 
    ? projects 
    : projects.filter(p => p.industry === filter);

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 md:px-6">
        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {industries.map(ind => (
            <button
              key={ind}
              onClick={() => setFilter(ind)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === ind 
                  ? 'bg-[var(--primary)] text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
              aria-pressed={filter === ind}
            >
              {ind}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <article key={project.id}>
              <Card hover className="flex flex-col h-full group">
                <div className="relative overflow-hidden h-64">
                  <img 
                    src={project.image} 
                    alt={`${project.title} - ${project.industry} web development project by Frontend Engineers FE`} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    width={800}
                    height={600}
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                      {project.industry}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-[var(--primary)] transition-colors">{project.title}</h3>
                  <p className="text-gray-600 mb-6 flex-grow">{project.shortDescription}</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tags.map(tag => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full">View Case Study</Button>
                </div>
              </Card>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PortfolioGrid;
