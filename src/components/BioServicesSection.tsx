import React from 'react';
import { Phone, Mail, ShieldCheck } from 'lucide-react';
import {
  CORE_SERVICES,
  CraftsmanProfile,
  PORTRAIT_ARTHUR_IMAGE,
} from '../lib/seedData';
import { CraftImage } from './CraftImage';

interface BioServicesSectionProps {
  profile: CraftsmanProfile;
  onSelectServiceForBooking: (serviceCategory: string) => void;
}

const SERVICE_MAP: Record<string, string> = {
  '01': 'Carpentry & Trim',
  '02': 'Kitchen & Bath',
  '03': 'Doors & Hardware',
  '04': 'Drywall & Paint',
  '05': 'Decks & Exterior',
};

export const BioServicesSection: React.FC<BioServicesSectionProps> = ({
  profile,
  onSelectServiceForBooking,
}) => {
  return (
    <section id="bio" className="py-16 lg:py-24 bg-white border-b border-[#E4E4DF]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Portrait + Personal Bio */}
          <div className="lg:col-span-5">
            <p className="text-xs font-medium text-[#1B4332] mb-2">
              Meet Your Craftsman
            </p>
            <h2
              className="font-display text-3xl font-bold tracking-tight text-[#141619] mb-6"
              style={{ textWrap: 'balance' }}
            >
              {profile.craftsmanName} — Detail-First Home Maintenance
            </h2>

            <div className="aspect-[3/4] max-w-sm rounded-xl overflow-hidden border border-[#E4E4DF] bg-[#ECECE7] mb-6">
              <CraftImage
                src={PORTRAIT_ARTHUR_IMAGE}
                alt={`Portrait of ${profile.craftsmanName} in his woodshop`}
                fallbackTitle={profile.craftsmanName}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-[15px] text-[#525760] leading-[1.65] mb-6">
              {profile.bioSummary}
            </p>

            {/* Clean Hairline Contact & License Block (no nested cards-within-cards) */}
            <div className="border-t border-[#E4E4DF] pt-5 space-y-2.5 text-sm text-[#141619]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#1B4332] shrink-0" />
                <span>{profile.licenseInfo}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#525760] shrink-0" />
                <span className="font-mono-num">{profile.phoneDisplay}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#525760] shrink-0" />
                <span>{profile.emailDisplay}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Numbered Trade Capabilities */}
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-baseline justify-between gap-4 pb-6 border-b border-[#E4E4DF]">
              <div>
                <p className="text-xs font-medium text-[#1B4332] mb-1">
                  Trade Capabilities &amp; Rates
                </p>
                <h3 className="font-display text-2xl font-semibold tracking-tight text-[#141619]">
                  What We Build, Repair &amp; Install
                </h3>
              </div>
              <div className="text-xs text-[#525760] font-mono-num">
                Base Rate ${profile.hourlyRate}/hr · Min ${profile.minimumCallout}
              </div>
            </div>

            <div className="divide-y divide-[#E4E4DF]">
              {CORE_SERVICES.map((service) => (
                <div
                  key={service.num}
                  className="py-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 group"
                >
                  <div className="max-w-lg">
                    <div className="flex items-baseline gap-3 mb-1.5">
                      <span className="font-mono-num text-xs font-medium text-[#1B4332]">
                        {service.num}.
                      </span>
                      <h4 className="font-display text-lg font-semibold text-[#141619]">
                        {service.title}
                      </h4>
                    </div>
                    <p className="text-sm text-[#525760] leading-relaxed pl-7">
                      {service.description}
                    </p>
                    <p className="text-xs text-[#525760] font-mono-num mt-2 pl-7">
                      {service.rateNote}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onSelectServiceForBooking(
                        SERVICE_MAP[service.num] || 'General Maintenance'
                      )
                    }
                    className="self-start sm:self-center ml-7 sm:ml-0 px-3.5 py-2 text-xs font-medium text-[#141619] border border-[#E4E4DF] rounded-lg hover:border-[#1B4332] hover:text-[#1B4332] transition-colors whitespace-nowrap shrink-0 min-h-[38px]"
                  >
                    Book Service
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
