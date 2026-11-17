import React from 'react';
import { ArrowRight, CalendarCheck, UserCheck } from 'lucide-react';
import { CraftsmanProfile, HERO_WORKSHOP_IMAGE } from '../lib/seedData';
import { CraftImage } from './CraftImage';

interface HeroSectionProps {
  profile: CraftsmanProfile;
  onBookClick: () => void;
  onOpenPortal: (initialTab: 'client' | 'admin') => void;
  isAdmin: boolean;
  userEmail: string | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  profile,
  onBookClick,
  onOpenPortal,
  isAdmin,
  userEmail,
}) => {
  return (
    <section id="top" className="border-b border-[#E4E4DF] bg-[#F8F8F6]">
      <div className="max-w-[1200px] mx-auto px-6 pt-10 pb-10 lg:pt-14 lg:pb-14">
        {/* 2-Column Hero Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between py-2">
            <div>
              <p className="text-xs font-medium text-[#525760] mb-4">
                <span>{profile.serviceArea}</span>
                <span className="mx-2" aria-hidden="true">·</span>
                <span>{profile.licenseInfo}</span>
              </p>

              <h1
                className="font-display font-bold tracking-tight text-[#141619] leading-[1.06] mb-5"
                style={{
                  fontSize: 'clamp(2.25rem, 4vw, 3.65rem)',
                  textWrap: 'balance',
                }}
              >
                {profile.headline}
              </h1>

              <p className="text-base text-[#525760] leading-relaxed max-w-xl mb-8">
                Dependable, finish-grade residential repairs, custom carpentry,
                fixture installations, and exterior maintenance by{' '}
                <strong className="font-medium text-[#141619]">
                  {profile.craftsmanName}
                </strong>
                . Check open weekly slots, review completed work, or calculate a
                transparent estimate in under two minutes.
              </p>

              <div className="flex flex-wrap items-center gap-5">
                <button
                  type="button"
                  onClick={onBookClick}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-[#1B4332] text-white rounded-lg hover:bg-[#143326] transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
                >
                  <span>Book Appointment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="#estimates"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#141619] hover:text-[#1B4332] underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
                >
                  <span>Estimate Project Cost</span>
                </a>
              </div>
            </div>

            {/* Subtle Workspace Utility Row (Placed below hero action rather than cluttering Top Bar) */}
            <div className="mt-10 pt-6 border-t border-[#E4E4DF] flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#525760]">
              <button
                type="button"
                onClick={() => onOpenPortal('client')}
                className="inline-flex items-center gap-1.5 font-medium text-[#141619] hover:text-[#1B4332] transition-colors min-h-[36px]"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-[#1B4332]" />
                <span>
                  {userEmail ? `My Bookings (${userEmail})` : 'My Bookings & Quotes'}
                </span>
              </button>
              <span aria-hidden="true" className="text-[#C8C8C0]">|</span>
              <button
                type="button"
                onClick={() => onOpenPortal('admin')}
                className="inline-flex items-center gap-1.5 font-medium text-[#525760] hover:text-[#141619] transition-colors min-h-[36px]"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{isAdmin ? 'Open Handyman Console' : 'Handyman Owner Login'}</span>
              </button>
            </div>
          </div>

          {/* Right Column Media matching height */}
          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[320px] lg:min-h-[440px] rounded-xl overflow-hidden border border-[#E4E4DF] bg-[#ECECE7]">
              <CraftImage
                src={HERO_WORKSHOP_IMAGE}
                alt="Arthur Vance fitting custom white oak built-in cabinetry in a sunlit home"
                fallbackTitle="Finish Carpentry & Home Repairs"
                className="w-full h-full lg:absolute lg:inset-0 object-cover"
              />
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Proof Strip */}
        <div className="mt-10 pt-8 border-t border-[#E4E4DF] grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-[#E4E4DF]">
          <div className="lg:pr-6">
            <div className="font-mono-num text-2xl font-medium text-[#141619]">
              {profile.yearsExperience} Years
            </div>
            <div className="text-xs text-[#525760] mt-1">
              Residential Carpentry &amp; Repair
            </div>
          </div>

          <div className="lg:px-6">
            <div className="font-mono-num text-2xl font-medium text-[#141619]">
              {profile.completedJobs.toLocaleString()}+
            </div>
            <div className="text-xs text-[#525760] mt-1">
              Completed Home Projects
            </div>
          </div>

          <div className="lg:px-6">
            <div className="font-mono-num text-2xl font-medium text-[#141619]">
              ${profile.hourlyRate}/hr
            </div>
            <div className="text-xs text-[#525760] mt-1">
              Standard Rate · ${profile.minimumCallout} Min. Callout
            </div>
          </div>

          <div className="lg:pl-6">
            <div className="font-mono-num text-2xl font-medium text-[#141619]">
              4.9 / 5.0
            </div>
            <div className="text-xs text-[#525760] mt-1">
              Verified Local Homeowner Rating
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
