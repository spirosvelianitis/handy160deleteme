import { useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import {
  ADMIN_EMAIL,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './lib/firebase';
import {
  CraftsmanProfile,
  DEFAULT_PROFILE,
  DEFAULT_PROJECTS,
  getUpcomingScheduleDays,
  ProjectItem,
  ScheduleSlotRecord,
} from './lib/seedData';
import { SlotKey } from './lib/validation';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { BioServicesSection } from './components/BioServicesSection';
import { GallerySection } from './components/GallerySection';
import { ScheduleSection } from './components/ScheduleSection';
import { BookingSection } from './components/BookingSection';
import { EstimateSection } from './components/EstimateSection';
import { ReviewsAndFooter } from './components/ReviewsAndFooter';
import { PortalDrawer } from './components/PortalDrawer';

function HandymanAppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [profile, setProfile] = useState<CraftsmanProfile>(DEFAULT_PROFILE);
  const [projects, setProjects] = useState<ProjectItem[]>(DEFAULT_PROJECTS);
  const [bookedSlots, setBookedSlots] = useState<Record<string, ScheduleSlotRecord>>({});

  // Default booking selection: first non-Sunday upcoming day + morning window
  const initialDate = useMemo(() => {
    const firstOpen = getUpcomingScheduleDays(7, 0).find((d) => !d.isSunday);
    return firstOpen?.dateStr || '2026-11-18';
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [selectedSlotKey, setSelectedSlotKey] = useState<SlotKey>('morning');
  const [selectedCategory, setSelectedCategory] = useState<string>('Carpentry & Trim');

  const [preselectedJobType, setPreselectedJobType] = useState<string | undefined>();
  const [preselectedNotes, setPreselectedNotes] = useState<string | undefined>();

  const [portalOpen, setPortalOpen] = useState(false);
  const [portalTab, setPortalTab] = useState<'client' | 'admin'>('client');

  // Auth listener + Admin check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setIsAdmin(false);
        return;
      }
      if (nextUser.email === ADMIN_EMAIL && nextUser.emailVerified) {
        setIsAdmin(true);
        return;
      }
      try {
        const adminDoc = await getDoc(doc(db, 'admins', nextUser.uid));
        setIsAdmin(adminDoc.exists());
      } catch {
        setIsAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  // Public Profile listener
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'profile', 'main'),
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as CraftsmanProfile);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'profile/main')
    );
    return () => unsub();
  }, []);

  // Public Projects listener (falls back to curated DEFAULT_PROJECTS if cloud gallery is empty)
  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('sortOrder', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          const items: ProjectItem[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ProjectItem, 'id'>),
          }));
          setProjects(items);
        } else {
          setProjects(DEFAULT_PROJECTS);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'projects')
    );
    return () => unsub();
  }, []);

  // Public Schedule Slots listener (Non-PII availability lock documents)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'schedule_slots'),
      (snap) => {
        const nextMap: Record<string, ScheduleSlotRecord> = {};
        snap.docs.forEach((d) => {
          nextMap[d.id] = {
            id: d.id,
            ...(d.data() as Omit<ScheduleSlotRecord, 'id'>),
          };
        });
        setBookedSlots(nextMap);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'schedule_slots')
    );
    return () => unsub();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectScheduleSlot = (dateStr: string, slotKey: SlotKey) => {
    setSelectedDate(dateStr);
    setSelectedSlotKey(slotKey);
    scrollToSection('appointments');
  };

  const handleSelectServiceForBooking = (serviceCategory: string) => {
    setSelectedCategory(serviceCategory);
    scrollToSection('appointments');
  };

  const handleRequestEstimateFromProject = (project: ProjectItem) => {
    const presetMap: Record<string, string> = {
      Carpentry: 'carpentry_shelving',
      'Kitchen & Bath': 'kitchen_bath',
      Exterior: 'deck_exterior',
      'Electrical & Lighting': 'lighting_electrical',
    };
    setPreselectedJobType(presetMap[project.category] || 'carpentry_shelving');
    setPreselectedNotes(
      `Interested in a project similar to "${project.title}" (${project.materials}).`
    );
    scrollToSection('estimates');
  };

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google sign-in dismissed or failed:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#141619]">
      <Navbar
        businessName={profile.businessName}
        onBookClick={() => scrollToSection('appointments')}
      />

      <main>
        <HeroSection
          profile={profile}
          onBookClick={() => scrollToSection('appointments')}
          onOpenPortal={(tab) => {
            setPortalTab(tab);
            setPortalOpen(true);
          }}
          isAdmin={isAdmin}
          userEmail={user?.email ?? null}
        />

        <BioServicesSection
          profile={profile}
          onSelectServiceForBooking={handleSelectServiceForBooking}
        />

        <GallerySection
          projects={projects}
          onRequestEstimateFromProject={handleRequestEstimateFromProject}
        />

        <ScheduleSection
          bookedSlots={bookedSlots}
          selectedDate={selectedDate}
          selectedSlotKey={selectedSlotKey}
          onSelectSlot={handleSelectScheduleSlot}
        />

        <BookingSection
          user={user}
          bookedSlots={bookedSlots}
          selectedDate={selectedDate}
          selectedSlotKey={selectedSlotKey}
          selectedCategory={selectedCategory}
          onChangeDate={setSelectedDate}
          onChangeSlotKey={setSelectedSlotKey}
          onChangeCategory={setSelectedCategory}
          onSignInRequested={handleSignIn}
          onOpenMyBookings={() => {
            setPortalTab('client');
            setPortalOpen(true);
          }}
        />

        <EstimateSection
          user={user}
          preselectedJobType={preselectedJobType}
          preselectedNotes={preselectedNotes}
        />

        <ReviewsAndFooter
          profile={profile}
          onOpenPortal={(tab) => {
            setPortalTab(tab);
            setPortalOpen(true);
          }}
        />
      </main>

      <PortalDrawer
        open={portalOpen}
        initialTab={portalTab}
        onClose={() => setPortalOpen(false)}
        user={user}
        isAdmin={isAdmin}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        profile={profile}
        projects={projects}
        bookedSlots={bookedSlots}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <HandymanAppContent />
    </ErrorBoundary>
  );
}
