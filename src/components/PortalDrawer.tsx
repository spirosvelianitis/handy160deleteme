import React, { useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  Calendar,
  Check,
  FileText,
  ImagePlus,
  LogOut,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  AppointmentRecord,
  CraftsmanProfile,
  DEFAULT_PROJECTS,
  EstimateRecord,
  getUpcomingScheduleDays,
  ProjectItem,
  ScheduleSlotRecord,
} from '../lib/seedData';
import {
  GALLERY_CATEGORIES,
  GalleryCategory,
  generateDocId,
  SLOT_KEYS,
  SLOT_LABELS,
} from '../lib/validation';

interface PortalDrawerProps {
  open: boolean;
  initialTab: 'client' | 'admin';
  onClose: () => void;
  user: User | null;
  isAdmin: boolean;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  profile: CraftsmanProfile;
  projects: ProjectItem[];
  bookedSlots: Record<string, ScheduleSlotRecord>;
}

type AdminSection = 'appointments' | 'estimates' | 'schedule' | 'bio' | 'gallery';

export const PortalDrawer: React.FC<PortalDrawerProps> = ({
  open,
  initialTab,
  onClose,
  user,
  isAdmin,
  onSignIn,
  onSignOut,
  profile,
  projects,
  bookedSlots,
}) => {
  const [mode, setMode] = useState<'client' | 'admin'>(initialTab);
  const [adminTab, setAdminTab] = useState<AdminSection>('appointments');

  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [estimates, setEstimates] = useState<EstimateRecord[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Admin Estimate Quote inputs
  const [quoteInputs, setQuoteInputs] = useState<
    Record<string, { amount: string; notes: string }>
  >({});

  // Admin Appointment Note inputs
  const [apptNotes, setApptNotes] = useState<Record<string, string>>({});

  // Admin Bio Editor state
  const [bioForm, setBioForm] = useState<CraftsmanProfile>(profile);

  // Admin Add Project state
  const [newProject, setNewProject] = useState({
    title: '',
    category: 'Carpentry' as GalleryCategory,
    neighborhood: '',
    duration: '1 Day',
    materials: '',
    summary: '',
    imageUrl: '/src/assets/images/gallery_built_in_shelving_1794881304054.jpg',
  });

  useEffect(() => {
    setMode(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setBioForm(profile);
  }, [profile]);

  // Listen to Appointments & Estimates only when user is authenticated
  useEffect(() => {
    if (!open || !user) {
      setAppointments([]);
      setEstimates([]);
      return;
    }

    const useAdminQueries = mode === 'admin' && isAdmin;

    const apptQuery = useAdminQueries
      ? collection(db, 'appointments')
      : query(collection(db, 'appointments'), where('userId', '==', user.uid));

    const estQuery = useAdminQueries
      ? collection(db, 'estimates')
      : query(collection(db, 'estimates'), where('userId', '==', user.uid));

    const unsubAppt = onSnapshot(
      apptQuery,
      (snap) => {
        const list: AppointmentRecord[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AppointmentRecord, 'id'>),
        }));
        list.sort((a, b) => b.date.localeCompare(a.date));
        setAppointments(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'appointments')
    );

    const unsubEst = onSnapshot(
      estQuery,
      (snap) => {
        const list: EstimateRecord[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<EstimateRecord, 'id'>),
        }));
        setEstimates(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'estimates')
    );

    return () => {
      unsubAppt();
      unsubEst();
    };
  }, [open, user, mode, isAdmin]);

  const adminDays = useMemo(() => getUpcomingScheduleDays(14, 0), []);

  if (!open) return null;

  const notify = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // --- Client Actions ---
  const handleClientCancelAppointment = async (appt: AppointmentRecord) => {
    try {
      await updateDoc(doc(db, 'appointments', appt.id), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
      notify('Appointment cancelled.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${appt.id}`);
    }
  };

  const handleClientAcceptEstimate = async (est: EstimateRecord) => {
    try {
      await updateDoc(doc(db, 'estimates', est.id), {
        status: 'accepted',
        updatedAt: serverTimestamp(),
      });
      notify('Formal quote accepted! Arthur will reach out to schedule.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `estimates/${est.id}`);
    }
  };

  // --- Admin Actions ---
  const handleAdminUpdateAppointment = async (
    appt: AppointmentRecord,
    nextStatus: AppointmentRecord['status']
  ) => {
    const notes = (apptNotes[appt.id] ?? appt.adminNotes).slice(0, 500);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'appointments', appt.id), {
        status: nextStatus,
        adminNotes: notes,
        updatedAt: serverTimestamp(),
      });
      if (nextStatus === 'cancelled') {
        batch.delete(doc(db, 'schedule_slots', appt.slotId));
      }
      await batch.commit();
      notify(`Appointment marked ${nextStatus}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${appt.id}`);
    }
  };

  const handleAdminSendQuote = async (est: EstimateRecord) => {
    const draft = quoteInputs[est.id];
    const parsedAmount = Number(draft?.amount ?? est.formalQuoteAmount);
    if (Number.isNaN(parsedAmount) || parsedAmount < 0 || parsedAmount > 100000) {
      notify('Enter a valid quote amount between $0 and $100,000.');
      return;
    }
    const notes = (draft?.notes ?? est.adminNotes).slice(0, 600);
    try {
      await updateDoc(doc(db, 'estimates', est.id), {
        status: 'quoted',
        formalQuoteAmount: parsedAmount,
        adminNotes: notes,
        updatedAt: serverTimestamp(),
      });
      notify(`Sent formal quote ($${parsedAmount.toLocaleString()}).`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `estimates/${est.id}`);
    }
  };

  const handleAdminArchiveEstimate = async (est: EstimateRecord) => {
    try {
      await updateDoc(doc(db, 'estimates', est.id), {
        status: 'archived',
        updatedAt: serverTimestamp(),
      });
      notify('Estimate archived.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `estimates/${est.id}`);
    }
  };

  const handleToggleSlotBlock = async (
    dateStr: string,
    slotKey: (typeof SLOT_KEYS)[number]
  ) => {
    const slotId = `${dateStr}_${slotKey}`;
    const existing = bookedSlots[slotId];
    try {
      if (existing) {
        await deleteDoc(doc(db, 'schedule_slots', slotId));
        notify(`Released ${dateStr} ${SLOT_LABELS[slotKey].label}.`);
      } else {
        await setDoc(doc(db, 'schedule_slots', slotId), {
          date: dateStr,
          slotKey,
          status: 'blocked',
          note: 'Blocked by Arthur',
          updatedAt: serverTimestamp(),
        });
        notify(`Blocked ${dateStr} ${SLOT_LABELS[slotKey].label}.`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `schedule_slots/${slotId}`);
    }
  };

  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'profile', 'main'), {
        ...bioForm,
        yearsExperience: Math.round(Number(bioForm.yearsExperience)),
        completedJobs: Math.round(Number(bioForm.completedJobs)),
        hourlyRate: Number(bioForm.hourlyRate),
        minimumCallout: Number(bioForm.minimumCallout),
        updatedAt: serverTimestamp(),
      });
      notify('Public craftsman bio and pricing updated.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'profile/main');
    }
  };

  const handleSeedDefaultProjects = async () => {
    try {
      const batch = writeBatch(db);
      for (const proj of DEFAULT_PROJECTS) {
        batch.set(doc(db, 'projects', proj.id), {
          title: proj.title,
          category: proj.category,
          neighborhood: proj.neighborhood,
          duration: proj.duration,
          materials: proj.materials,
          summary: proj.summary,
          imageUrl: proj.imageUrl,
          featured: proj.featured,
          sortOrder: proj.sortOrder,
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
      notify('Seeded portfolio projects into Firestore.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'projects');
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = generateDocId('proj');
    try {
      await setDoc(doc(db, 'projects', id), {
        ...newProject,
        featured: false,
        sortOrder: projects.length + 1,
        createdAt: serverTimestamp(),
      });
      setNewProject({
        title: '',
        category: 'Carpentry',
        neighborhood: '',
        duration: '1 Day',
        materials: '',
        summary: '',
        imageUrl: '/src/assets/images/gallery_built_in_shelving_1794881304054.jpg',
      });
      notify('Added new project to portfolio gallery.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `projects/${id}`);
    }
  };

  const handleDeleteProject = async (projId: string) => {
    try {
      await deleteDoc(doc(db, 'projects', projId));
      notify('Removed project from gallery.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${projId}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Client and Handyman Portal"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white h-full overflow-y-auto border-l border-[#E4E4DF] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#E4E4DF] px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[#141619]">
              {mode === 'admin' && isAdmin
                ? 'Handyman Owner Console'
                : 'Bookings & Estimate Portal'}
            </h2>
            <p className="text-xs text-[#525760]">
              {user ? `Signed in as ${user.email}` : 'Sign in with Google to view or manage records'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#525760] border border-[#E4E4DF] rounded-lg hover:text-[#141619]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close portal"
              className="w-9 h-9 rounded-lg border border-[#E4E4DF] flex items-center justify-center text-[#141619] hover:bg-[#F8F8F6]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Switcher when Admin is signed in */}
        {user && isAdmin && (
          <div className="px-6 pt-4 pb-2 border-b border-[#E4E4DF] bg-[#F8F8F6] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-[#ECECE7] rounded-lg">
              <button
                type="button"
                onClick={() => setMode('admin')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  mode === 'admin'
                    ? 'bg-white text-[#141619] shadow-xs'
                    : 'text-[#525760]'
                }`}
              >
                Owner Console
              </button>
              <button
                type="button"
                onClick={() => setMode('client')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  mode === 'client'
                    ? 'bg-white text-[#141619] shadow-xs'
                    : 'text-[#525760]'
                }`}
              >
                My Personal Requests
              </button>
            </div>
          </div>
        )}

        {feedback && (
          <div className="mx-6 mt-4 px-4 py-2.5 text-xs font-medium bg-[#1B4332] text-white rounded-lg">
            {feedback}
          </div>
        )}

        <div className="p-6 flex-1 space-y-6">
          {/* Unauthenticated Sign-in Gate */}
          {!user ? (
            <div className="bg-[#F8F8F6] border border-[#E4E4DF] rounded-xl p-8 text-center max-w-md mx-auto my-12">
              <h3 className="font-display text-xl font-bold text-[#141619] mb-2">
                {mode === 'admin' ? 'Handyman Owner Sign-In' : 'Track Your Bookings & Quotes'}
              </h3>
              <p className="text-sm text-[#525760] leading-relaxed mb-6">
                {mode === 'admin'
                  ? 'Sign in with your authorized Google account to manage appointments, send formal quotes, block schedule windows, and edit your bio or gallery.'
                  : 'Sign in with Google to view appointment statuses, accept written estimates, or cancel an upcoming visit.'}
              </p>
              <button
                type="button"
                onClick={onSignIn}
                className="w-full px-5 py-3 text-sm font-medium bg-[#1B4332] text-white rounded-lg hover:bg-[#143326] transition-colors"
              >
                Continue with Google
              </button>
            </div>
          ) : mode === 'admin' && !isAdmin ? (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-6 text-sm text-[#991B1B]">
              Signed-in account ({user.email}) does not have Handyman Owner
              permissions. Switch to &ldquo;My Bookings &amp; Quotes&rdquo; to
              track your client requests.
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setMode('client')}
                  className="px-4 py-2 text-xs font-medium bg-white border border-[#FECACA] rounded-lg text-[#141619]"
                >
                  View My Client Bookings
                </button>
              </div>
            </div>
          ) : mode === 'admin' && isAdmin ? (
            /* ---------------- ADMIN OWNER CONSOLE ---------------- */
            <div className="space-y-6">
              <div className="flex flex-wrap gap-1.5 border-b border-[#E4E4DF] pb-4">
                {(
                  [
                    { id: 'appointments', label: `Appointments (${appointments.length})`, icon: Calendar },
                    { id: 'estimates', label: `Estimates (${estimates.length})`, icon: FileText },
                    { id: 'schedule', label: 'Schedule Manager', icon: Calendar },
                    { id: 'bio', label: 'Bio & Rates', icon: Settings },
                    { id: 'gallery', label: 'Gallery', icon: ImagePlus },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAdminTab(tab.id)}
                    className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      adminTab === tab.id
                        ? 'bg-[#141619] border-[#141619] text-white'
                        : 'bg-white border-[#E4E4DF] text-[#525760] hover:text-[#141619]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {adminTab === 'appointments' && (
                <div className="space-y-4">
                  {appointments.length === 0 ? (
                    <p className="text-sm text-[#525760] py-8 text-center">
                      No customer appointments booked yet.
                    </p>
                  ) : (
                    appointments.map((appt) => (
                      <div
                        key={appt.id}
                        className="border border-[#E4E4DF] rounded-xl p-5 space-y-3 bg-white"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="font-display font-semibold text-[#141619]">
                              {appt.clientName} — {appt.serviceCategory}
                            </div>
                            <div className="font-mono-num text-xs text-[#525760] mt-0.5">
                              {appt.date} · {SLOT_LABELS[appt.slotKey]?.window || appt.slotKey}
                            </div>
                          </div>
                          <span className="text-xs font-medium uppercase tracking-wide text-[#1B4332]">
                            Status: {appt.status}
                          </span>
                        </div>

                        <div className="text-xs text-[#525760] space-y-1">
                          <div>
                            {appt.clientEmail} · {appt.clientPhone}
                          </div>
                          <div>Address: {appt.serviceAddress}</div>
                          <div className="text-[#141619] pt-1">{appt.description}</div>
                        </div>

                        <div className="pt-2 border-t border-[#E4E4DF] flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            placeholder="Internal / client note..."
                            value={apptNotes[appt.id] ?? appt.adminNotes}
                            onChange={(e) =>
                              setApptNotes((prev) => ({
                                ...prev,
                                [appt.id]: e.target.value,
                              }))
                            }
                            className="flex-1 px-3 py-1.5 text-xs border border-[#E4E4DF] rounded-lg"
                          />
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAdminUpdateAppointment(appt, 'confirmed')}
                              className="px-3 py-1.5 text-xs font-medium bg-[#1B4332] text-white rounded-lg"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdminUpdateAppointment(appt, 'completed')}
                              className="px-3 py-1.5 text-xs font-medium border border-[#E4E4DF] rounded-lg text-[#141619]"
                            >
                              Complete
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdminUpdateAppointment(appt, 'cancelled')}
                              className="px-3 py-1.5 text-xs font-medium border border-[#FECACA] text-[#991B1B] rounded-lg"
                            >
                              Cancel &amp; Free Slot
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {adminTab === 'estimates' && (
                <div className="space-y-4">
                  {estimates.length === 0 ? (
                    <p className="text-sm text-[#525760] py-8 text-center">
                      No estimate requests received yet.
                    </p>
                  ) : (
                    estimates.map((est) => (
                      <div
                        key={est.id}
                        className="border border-[#E4E4DF] rounded-xl p-5 space-y-3 bg-white"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="font-display font-semibold text-[#141619]">
                              {est.clientName} — {est.jobType}
                            </div>
                            <div className="text-xs text-[#525760] mt-0.5">
                              {est.neighborhood} · Ballpark{' '}
                              <span className="font-mono-num">
                                ${est.estimatedMin}–${est.estimatedMax}
                              </span>{' '}
                              ({est.estimatedHours})
                            </div>
                          </div>
                          <span className="text-xs font-medium uppercase tracking-wide text-[#1B4332]">
                            Status: {est.status}
                          </span>
                        </div>

                        <div className="text-xs text-[#525760]">
                          {est.clientEmail} · {est.clientPhone} · Materials:{' '}
                          {est.materialsBy} · Complexity: {est.complexity}
                        </div>
                        <p className="text-xs text-[#141619]">{est.projectNotes}</p>

                        <div className="pt-3 border-t border-[#E4E4DF] grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <input
                            type="number"
                            min={0}
                            placeholder="Quote $"
                            value={
                              quoteInputs[est.id]?.amount ??
                              (est.formalQuoteAmount ? String(est.formalQuoteAmount) : '')
                            }
                            onChange={(e) =>
                              setQuoteInputs((prev) => ({
                                ...prev,
                                [est.id]: {
                                  amount: e.target.value,
                                  notes: prev[est.id]?.notes ?? est.adminNotes,
                                },
                              }))
                            }
                            className="sm:col-span-3 px-3 py-1.5 text-xs border border-[#E4E4DF] rounded-lg font-mono-num"
                          />
                          <input
                            type="text"
                            placeholder="Quote scope notes..."
                            value={quoteInputs[est.id]?.notes ?? est.adminNotes}
                            onChange={(e) =>
                              setQuoteInputs((prev) => ({
                                ...prev,
                                [est.id]: {
                                  amount:
                                    prev[est.id]?.amount ??
                                    (est.formalQuoteAmount
                                      ? String(est.formalQuoteAmount)
                                      : ''),
                                  notes: e.target.value,
                                },
                              }))
                            }
                            className="sm:col-span-5 px-3 py-1.5 text-xs border border-[#E4E4DF] rounded-lg"
                          />
                          <div className="sm:col-span-4 flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAdminSendQuote(est)}
                              className="flex-1 px-3 py-1.5 text-xs font-medium bg-[#1B4332] text-white rounded-lg"
                            >
                              Send Quote
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdminArchiveEstimate(est)}
                              className="px-3 py-1.5 text-xs font-medium border border-[#E4E4DF] rounded-lg text-[#525760]"
                            >
                              Archive
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {adminTab === 'schedule' && (
                <div className="space-y-4">
                  <p className="text-xs text-[#525760]">
                    Click any open window to block it off (shop days, material runs),
                    or click a blocked/booked slot to reopen it on the public calendar.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {adminDays
                      .filter((d) => !d.isSunday)
                      .map((day) => (
                        <div
                          key={day.dateStr}
                          className="border border-[#E4E4DF] rounded-xl p-3.5"
                        >
                          <div className="text-xs font-semibold text-[#141619] mb-2">
                            {day.dayName}, {day.shortDate}{' '}
                            <span className="font-mono-num text-[#525760] font-normal">
                              ({day.dateStr})
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {SLOT_KEYS.map((key) => {
                              const rec = bookedSlots[`${day.dateStr}_${key}`];
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => handleToggleSlotBlock(day.dateStr, key)}
                                  className={`px-2 py-2 rounded-lg text-[11px] font-medium border transition-colors ${
                                    rec
                                      ? 'bg-[#141619] border-[#141619] text-white'
                                      : 'bg-white border-[#E4E4DF] text-[#141619] hover:border-[#1B4332]'
                                  }`}
                                >
                                  <div>{SLOT_LABELS[key].label}</div>
                                  <div className="opacity-75 mt-0.5">
                                    {rec ? rec.status : 'open'}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {adminTab === 'bio' && (
                <form onSubmit={handleSaveBio} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#141619] mb-1">
                        Business Name
                      </label>
                      <input
                        type="text"
                        required
                        value={bioForm.businessName}
                        onChange={(e) =>
                          setBioForm({ ...bioForm, businessName: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm border border-[#E4E4DF] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#141619] mb-1">
                        Craftsman Name
                      </label>
                      <input
                        type="text"
                        required
                        value={bioForm.craftsmanName}
                        onChange={(e) =>
                          setBioForm({ ...bioForm, craftsmanName: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm border border-[#E4E4DF] rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#141619] mb-1">
                      Hero Headline
                    </label>
                    <input
                      type="text"
                      required
                      value={bioForm.headline}
                      onChange={(e) =>
                        setBioForm({ ...bioForm, headline: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#E4E4DF] rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#141619] mb-1">
                        Hourly Rate ($)
                      </label>
                      <input
                        type="number"
                        required
                        value={bioForm.hourlyRate}
                        onChange={(e) =>
                          setBioForm({
                            ...bioForm,
                            hourlyRate: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-[#E4E4DF] rounded-lg font-mono-num"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#141619] mb-1">
                        Min. Callout ($)
                      </label>
                      <input
                        type="number"
                        required
                        value={bioForm.minimumCallout}
                        onChange={(e) =>
                          setBioForm({
                            ...bioForm,
                            minimumCallout: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-[#E4E4DF] rounded-lg font-mono-num"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#141619] mb-1">
                        Years Exp.
                      </label>
                      <input
                        type="number"
                        required
                        value={bioForm.yearsExperience}
                        onChange={(e) =>
                          setBioForm({
                            ...bioForm,
                            yearsExperience: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-[#E4E4DF] rounded-lg font-mono-num"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#141619] mb-1">
                        Jobs Done
                      </label>
                      <input
                        type="number"
                        required
                        value={bioForm.completedJobs}
                        onChange={(e) =>
                          setBioForm({
                            ...bioForm,
                            completedJobs: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-[#E4E4DF] rounded-lg font-mono-num"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#141619] mb-1">
                      Biography
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={bioForm.bioSummary}
                      onChange={(e) =>
                        setBioForm({ ...bioForm, bioSummary: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#E4E4DF] rounded-lg"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-medium bg-[#1B4332] text-white rounded-lg hover:bg-[#143326]"
                  >
                    Save Profile &amp; Rates
                  </button>
                </form>
              )}

              {adminTab === 'gallery' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-[#525760]">
                      Manage portfolio photos stored in Firestore.
                    </div>
                    <button
                      type="button"
                      onClick={handleSeedDefaultProjects}
                      className="px-3 py-1.5 text-xs font-medium border border-[#E4E4DF] rounded-lg hover:border-[#1B4332]"
                    >
                      Sync Default Gallery to Cloud
                    </button>
                  </div>

                  <form
                    onSubmit={handleAddProject}
                    className="border border-[#E4E4DF] rounded-xl p-4 space-y-3 bg-[#F8F8F6]"
                  >
                    <div className="text-xs font-semibold text-[#141619]">
                      Add Portfolio Project
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Project title"
                        value={newProject.title}
                        onChange={(e) =>
                          setNewProject({ ...newProject, title: e.target.value })
                        }
                        className="px-3 py-2 text-xs bg-white border border-[#E4E4DF] rounded-lg"
                      />
                      <select
                        value={newProject.category}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            category: e.target.value as GalleryCategory,
                          })
                        }
                        className="px-3 py-2 text-xs bg-white border border-[#E4E4DF] rounded-lg"
                      >
                        {GALLERY_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        required
                        placeholder="Neighborhood (e.g. Hawthorne)"
                        value={newProject.neighborhood}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            neighborhood: e.target.value,
                          })
                        }
                        className="px-3 py-2 text-xs bg-white border border-[#E4E4DF] rounded-lg"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Duration (e.g. 2 Days)"
                        value={newProject.duration}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            duration: e.target.value,
                          })
                        }
                        className="px-3 py-2 text-xs bg-white border border-[#E4E4DF] rounded-lg"
                      />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Materials used"
                      value={newProject.materials}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          materials: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E4E4DF] rounded-lg"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Image URL"
                      value={newProject.imageUrl}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          imageUrl: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E4E4DF] rounded-lg"
                    />
                    <textarea
                      rows={2}
                      required
                      placeholder="Project summary..."
                      value={newProject.summary}
                      onChange={(e) =>
                        setNewProject({ ...newProject, summary: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E4E4DF] rounded-lg"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-medium bg-[#1B4332] text-white rounded-lg"
                    >
                      Publish Project
                    </button>
                  </form>

                  <div className="divide-y divide-[#E4E4DF] border border-[#E4E4DF] rounded-xl">
                    {projects.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="text-sm font-medium text-[#141619]">
                            {p.title}
                          </div>
                          <div className="text-xs text-[#525760]">
                            {p.category} · {p.neighborhood} · {p.duration}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(p.id)}
                          aria-label={`Delete ${p.title}`}
                          className="p-2 text-[#525760] hover:text-[#991B1B]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ---------------- CLIENT BOOKINGS & ESTIMATES ---------------- */
            <div className="space-y-8">
              <div>
                <h3 className="font-display text-base font-bold text-[#141619] mb-3">
                  My Appointments ({appointments.length})
                </h3>
                {appointments.length === 0 ? (
                  <div className="border border-[#E4E4DF] rounded-xl p-6 text-sm text-[#525760]">
                    No appointments linked to {user.email} yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((appt) => (
                      <div
                        key={appt.id}
                        className="border border-[#E4E4DF] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-sm font-semibold text-[#141619]">
                            {appt.serviceCategory}
                          </div>
                          <div className="font-mono-num text-xs text-[#525760] mt-0.5">
                            {appt.date} · {SLOT_LABELS[appt.slotKey]?.window || appt.slotKey}
                          </div>
                          {appt.adminNotes && (
                            <p className="text-xs text-[#1B4332] mt-1.5">
                              Note from Arthur: {appt.adminNotes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium uppercase text-[#1B4332]">
                            {appt.status}
                          </span>
                          {(appt.status === 'pending' ||
                            appt.status === 'confirmed') && (
                            <button
                              type="button"
                              onClick={() => handleClientCancelAppointment(appt)}
                              className="px-3 py-1.5 text-xs font-medium border border-[#FECACA] text-[#991B1B] rounded-lg"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-display text-base font-bold text-[#141619] mb-3">
                  My Estimate Requests ({estimates.length})
                </h3>
                {estimates.length === 0 ? (
                  <div className="border border-[#E4E4DF] rounded-xl p-6 text-sm text-[#525760]">
                    No estimate requests linked to {user.email} yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {estimates.map((est) => (
                      <div
                        key={est.id}
                        className="border border-[#E4E4DF] rounded-xl p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-[#141619]">
                            {est.jobType}
                          </div>
                          <span className="text-xs font-medium uppercase text-[#1B4332]">
                            {est.status}
                          </span>
                        </div>
                        <div className="text-xs text-[#525760]">
                          Ballpark:{' '}
                          <span className="font-mono-num">
                            ${est.estimatedMin}–${est.estimatedMax}
                          </span>
                          {est.formalQuoteAmount > 0 && (
                            <span className="ml-3 font-medium text-[#141619] font-mono-num">
                              Formal Quote: ${est.formalQuoteAmount.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {est.adminNotes && (
                          <p className="text-xs text-[#141619]">
                            Arthur&apos;s Note: {est.adminNotes}
                          </p>
                        )}
                        {est.status === 'quoted' && (
                          <button
                            type="button"
                            onClick={() => handleClientAcceptEstimate(est)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1B4332] text-white rounded-lg"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept Formal Quote</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
