import React from 'react';
import { CLIENT_REVIEWS, CraftsmanProfile } from '../lib/seedData';

interface ReviewsAndFooterProps {
  profile: CraftsmanProfile;
  onOpenPortal: (tab: 'client' | 'admin') => void;
}

export const ReviewsAndFooter: React.FC<ReviewsAndFooterProps> = ({
  profile,
  onOpenPortal,
}) => {
  return (
    <>
      {/* Attributable Client Reviews */}
      <section className="py-16 lg:py-20 bg-[#F8F8F6] border-b border-[#E4E4DF]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-10">
            <p className="text-xs font-medium text-[#1B4332] mb-2">
              Homeowner Feedback
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#141619]">
              Verified Local Projects
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CLIENT_REVIEWS.map((rev) => (
              <blockquote
                key={rev.name}
                className="bg-white border border-[#E4E4DF] rounded-xl p-6 flex flex-col justify-between"
              >
                <p className="text-sm text-[#141619] leading-relaxed mb-6">
                  &ldquo;{rev.quote}&rdquo;
                </p>
                <footer className="pt-4 border-t border-[#E4E4DF]">
                  <div className="text-sm font-semibold text-[#141619]">
                    {rev.name}
                  </div>
                  <div className="text-xs text-[#525760] mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span>{rev.neighborhood}</span>
                    <span aria-hidden="true">·</span>
                    <span>{rev.project}</span>
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Quiet Architectural Footer */}
      <footer className="bg-[#141619] text-white/85 py-12">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="font-display text-lg font-bold text-white mb-1">
              {profile.businessName}
            </div>
            <p className="text-xs text-white/65">
              {profile.serviceArea} · {profile.licenseInfo}
            </p>
            <p className="text-xs text-white/65 font-mono-num mt-1">
              {profile.phoneDisplay} · {profile.emailDisplay}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs">
            <a href="#bio" className="hover:text-white transition-colors">
              Bio &amp; Rates
            </a>
            <a href="#gallery" className="hover:text-white transition-colors">
              Gallery
            </a>
            <a href="#schedule" className="hover:text-white transition-colors">
              Schedule
            </a>
            <a href="#estimates" className="hover:text-white transition-colors">
              Estimates
            </a>
            <button
              type="button"
              onClick={() => onOpenPortal('client')}
              className="text-white hover:underline underline-offset-4"
            >
              My Bookings
            </button>
            <button
              type="button"
              onClick={() => onOpenPortal('admin')}
              className="text-white/75 hover:text-white underline underline-offset-4"
            >
              Handyman Portal
            </button>
          </div>
        </div>
      </footer>
    </>
  );
};
