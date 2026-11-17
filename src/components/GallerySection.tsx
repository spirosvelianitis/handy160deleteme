import React, { useEffect, useState } from 'react';
import { Expand, X, ArrowRight } from 'lucide-react';
import { ProjectItem } from '../lib/seedData';
import { GALLERY_CATEGORIES } from '../lib/validation';
import { CraftImage } from './CraftImage';

interface GallerySectionProps {
  projects: ProjectItem[];
  onRequestEstimateFromProject: (project: ProjectItem) => void;
}

export const GallerySection: React.FC<GallerySectionProps> = ({
  projects,
  onRequestEstimateFromProject,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProject(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const filtered =
    activeFilter === 'All'
      ? projects
      : projects.filter((p) => p.category === activeFilter);

  return (
    <section id="gallery" className="py-16 lg:py-24 bg-[#F8F8F6] border-b border-[#E4E4DF]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-medium text-[#1B4332] mb-2">
              Project Photography
            </p>
            <h2
              className="font-display text-3xl font-bold tracking-tight text-[#141619]"
              style={{ textWrap: 'balance' }}
            >
              Recent Residential Work
            </h2>
          </div>

          {/* Interactive Filter Segmented Control */}
          <div
            role="tablist"
            aria-label="Filter gallery by trade category"
            className="flex flex-wrap items-center gap-1 p-1 bg-[#ECECE7] rounded-lg"
          >
            {['All', ...GALLERY_CATEGORIES].map((cat) => {
              const active = activeFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
                    active
                      ? 'bg-white text-[#141619] shadow-xs'
                      : 'text-[#525760] hover:text-[#141619]'
                  }`}
                >
                  {cat === 'All' ? 'All Work' : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Asymmetric Bento Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-[#E4E4DF] rounded-xl p-12 text-center text-sm text-[#525760]">
            No projects in this category yet. Check back soon or request a custom estimate.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filtered.map((project, idx) => {
              const isHeroTile = activeFilter === 'All' && idx === 0;
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedProject(project)}
                  className={`group text-left bg-white border border-[#E4E4DF] rounded-xl overflow-hidden hover:border-[#1B4332]/50 transition-colors flex flex-col ${
                    isHeroTile ? 'md:col-span-2 md:row-span-2' : ''
                  }`}
                >
                  <div
                    className={`relative w-full overflow-hidden bg-[#ECECE7] ${
                      isHeroTile ? 'aspect-[4/3] md:h-full md:min-h-[420px]' : 'aspect-[4/3]'
                    }`}
                  >
                    <CraftImage
                      src={project.imageUrl}
                      alt={project.title}
                      fallbackTitle={project.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none" />
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/55 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Expand className="w-4 h-4" />
                    </div>
                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <div className="text-xs text-white/85 flex items-center gap-2 mb-0.5">
                        <span>{project.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{project.neighborhood}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num">{project.duration}</span>
                      </div>
                      <h3 className="font-display text-base sm:text-lg font-semibold leading-snug">
                        {project.title}
                      </h3>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
          onClick={() => setSelectedProject(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-title"
        >
          <div
            className="bg-white rounded-xl max-w-4xl w-full overflow-hidden border border-[#E4E4DF] grid grid-cols-1 md:grid-cols-12"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="md:col-span-7 bg-[#141619] relative min-h-[260px] sm:min-h-[380px]">
              <CraftImage
                src={selectedProject.imageUrl}
                alt={selectedProject.title}
                fallbackTitle={selectedProject.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="text-xs text-[#525760] flex flex-wrap items-center gap-2">
                    <span className="font-medium text-[#1B4332]">
                      {selectedProject.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedProject.neighborhood}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-num">{selectedProject.duration}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProject(null)}
                    aria-label="Close project details"
                    className="w-9 h-9 rounded-lg border border-[#E4E4DF] flex items-center justify-center text-[#141619] hover:bg-[#F8F8F6] shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h3
                  id="lightbox-title"
                  className="font-display text-2xl font-bold tracking-tight text-[#141619] mb-4"
                >
                  {selectedProject.title}
                </h3>

                <p className="text-sm text-[#525760] leading-relaxed mb-6">
                  {selectedProject.summary}
                </p>

                <div className="border-t border-[#E4E4DF] pt-4">
                  <div className="text-xs font-medium text-[#141619] mb-1">
                    Materials &amp; Hardware
                  </div>
                  <div className="text-xs text-[#525760] leading-relaxed">
                    {selectedProject.materials}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[#E4E4DF]">
                <button
                  type="button"
                  onClick={() => {
                    const proj = selectedProject;
                    setSelectedProject(null);
                    onRequestEstimateFromProject(proj);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium bg-[#1B4332] text-white rounded-lg hover:bg-[#143326] transition-colors"
                >
                  <span>Request Estimate for Similar Work</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
