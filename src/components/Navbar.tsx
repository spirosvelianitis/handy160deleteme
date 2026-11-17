import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  businessName: string;
  onBookClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ businessName, onBookClick }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '#bio', label: 'Bio' },
    { href: '#gallery', label: 'Gallery' },
    { href: '#schedule', label: 'Schedule' },
    { href: '#estimates', label: 'Estimates' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#F8F8F6]/95 backdrop-blur-sm border-b border-[#E4E4DF]">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-[#141619] whitespace-nowrap shrink-0"
        >
          {businessName}
        </a>

        {/* Zone 2: Concise single-line nav links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#525760]"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-[#141619] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onBookClick}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-white bg-[#1B4332] rounded-lg hover:bg-[#143326] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
          >
            Book Appointment
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-[#E4E4DF] bg-white text-[#141619]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E4E4DF] bg-white px-6 py-4 space-y-2">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 text-sm font-medium text-[#141619] border-b border-[#E4E4DF]/60"
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onBookClick();
            }}
            className="w-full mt-2 px-4 py-3 text-sm font-medium text-white bg-[#1B4332] rounded-lg"
          >
            Book Appointment
          </button>
        </div>
      )}
    </header>
  );
};
