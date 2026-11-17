import React, { useMemo, useState } from 'react';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Calendar, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  getUpcomingScheduleDays,
  ScheduleSlotRecord,
} from '../lib/seedData';
import {
  generateDocId,
  SERVICE_CATEGORIES,
  SLOT_KEYS,
  SLOT_LABELS,
  SlotKey,
  validateAppointmentInput,
} from '../lib/validation';

interface BookingSectionProps {
  user: User | null;
  bookedSlots: Record<string, ScheduleSlotRecord>;
  selectedDate: string;
  selectedSlotKey: SlotKey;
  selectedCategory: string;
  onChangeDate: (d: string) => void;
  onChangeSlotKey: (k: SlotKey) => void;
  onChangeCategory: (c: string) => void;
  onSignInRequested: () => void;
  onOpenMyBookings: () => void;
}

export const BookingSection: React.FC<BookingSectionProps> = ({
  user,
  bookedSlots,
  selectedDate,
  selectedSlotKey,
  selectedCategory,
  onChangeDate,
  onChangeSlotKey,
  onChangeCategory,
  onSignInRequested,
  onOpenMyBookings,
}) => {
  const [clientName, setClientName] = useState(user?.displayName || '');
  const [clientEmail, setClientEmail] = useState(user?.email || '');
  const [clientPhone, setClientPhone] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedRef, setConfirmedRef] = useState<{
    id: string;
    date: string;
    windowLabel: string;
    category: string;
  } | null>(null);

  const upcomingWorkDays = useMemo(
    () => getUpcomingScheduleDays(14, 0).filter((d) => !d.isSunday),
    []
  );

  const currentSlotId = `${selectedDate}_${selectedSlotKey}`;
  const isSlotTaken = Boolean(bookedSlots[currentSlotId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isSlotTaken) {
      setErrorMsg(
        'That arrival window was just booked or blocked. Please select an open window.'
      );
      return;
    }

    const effectiveName = clientName.trim() || user?.displayName || '';
    const effectiveEmail = clientEmail.trim() || user?.email || '';

    const validationError = validateAppointmentInput({
      clientName: effectiveName,
      clientEmail: effectiveEmail,
      clientPhone,
      serviceAddress,
      date: selectedDate,
      slotKey: selectedSlotKey,
      description,
    });

    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setSubmitting(true);
    const appointmentId = generateDocId('appt');
    const slotId = `${selectedDate}_${selectedSlotKey}`;

    try {
      const batch = writeBatch(db);
      const apptRef = doc(db, 'appointments', appointmentId);
      const slotRef = doc(db, 'schedule_slots', slotId);

      batch.set(apptRef, {
        userId: user ? user.uid : 'guest',
        clientName: effectiveName,
        clientEmail: effectiveEmail,
        clientPhone: clientPhone.trim(),
        serviceAddress: serviceAddress.trim(),
        serviceCategory: selectedCategory,
        date: selectedDate,
        slotKey: selectedSlotKey,
        slotId,
        description: description.trim(),
        status: 'pending',
        adminNotes: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batch.set(slotRef, {
        date: selectedDate,
        slotKey: selectedSlotKey,
        status: 'booked',
        appointmentId,
        note: 'Client appointment',
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      setConfirmedRef({
        id: appointmentId,
        date: selectedDate,
        windowLabel: `${SLOT_LABELS[selectedSlotKey].label} (${SLOT_LABELS[selectedSlotKey].window})`,
        category: selectedCategory,
      });
      setDescription('');
      setClientPhone('');
      setServiceAddress('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('permission')) {
        try {
          handleFirestoreError(err, OperationType.WRITE, `appointments/${appointmentId}`);
        } catch {
          setErrorMsg(
            'Unable to reserve that slot—it may already be booked or invalid. Please pick another open time.'
          );
        }
      } else {
        setErrorMsg('Could not submit booking. Please check your connection and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="appointments"
      className="py-16 lg:py-24 bg-[#F8F8F6] border-b border-[#E4E4DF]"
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: Selected Slot Summary & Controls */}
          <div className="lg:col-span-5">
            <p className="text-xs font-medium text-[#1B4332] mb-2">
              Book Appointment
            </p>
            <h2
              className="font-display text-3xl font-bold tracking-tight text-[#141619] mb-4"
              style={{ textWrap: 'balance' }}
            >
              Reserve Your Arrival Window
            </h2>
            <p className="text-sm text-[#525760] leading-relaxed mb-8">
              Choose a service category and arrival window. Arthur confirms all
              new bookings within 2 business hours and arrives with a stocked
              service van.
            </p>

            <div className="bg-white border border-[#E4E4DF] rounded-xl p-6 space-y-5">
              <div>
                <label
                  htmlFor="booking-category"
                  className="block text-xs font-medium text-[#141619] mb-2"
                >
                  Service Category
                </label>
                <select
                  id="booking-category"
                  value={selectedCategory}
                  onChange={(e) => onChangeCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E4DF] rounded-lg text-[#141619] min-h-[42px]"
                >
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="booking-date"
                  className="block text-xs font-medium text-[#141619] mb-2"
                >
                  Preferred Date
                </label>
                <select
                  id="booking-date"
                  value={selectedDate}
                  onChange={(e) => onChangeDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E4DF] rounded-lg text-[#141619] min-h-[42px] font-mono-num"
                >
                  {upcomingWorkDays.map((day) => (
                    <option key={day.dateStr} value={day.dateStr}>
                      {day.dayName}, {day.shortDate} ({day.dateStr})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-xs font-medium text-[#141619] mb-2">
                  Arrival Window
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {SLOT_KEYS.map((key) => {
                    const taken = Boolean(bookedSlots[`${selectedDate}_${key}`]);
                    const active = selectedSlotKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={taken}
                        onClick={() => onChangeSlotKey(key)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-left transition-colors min-h-[44px] ${
                          taken
                            ? 'bg-[#F8F8F6] border-[#E4E4DF] text-[#525760]/60 cursor-not-allowed'
                            : active
                              ? 'bg-[#1B4332] border-[#1B4332] text-white'
                              : 'bg-white border-[#E4E4DF] text-[#141619] hover:border-[#1B4332]'
                        }`}
                      >
                        <span className="text-xs font-medium">
                          {SLOT_LABELS[key].label}
                        </span>
                        <span className="font-mono-num text-xs">
                          {taken ? 'Unavailable' : SLOT_LABELS[key].window}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E4E4DF] flex items-center justify-between text-xs text-[#525760]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Portland Metro · No trip fee</span>
                </span>
                <span className="font-mono-num">$145 Min.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Booking Form or Confirmation */}
          <div className="lg:col-span-7">
            {confirmedRef ? (
              <div className="bg-white border border-[#1B4332]/30 rounded-xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-[#1B4332]" />
                  <h3 className="font-display text-2xl font-bold text-[#141619]">
                    Appointment Reserved
                  </h3>
                </div>
                <p className="text-sm text-[#525760] leading-relaxed mb-6">
                  Your arrival window is now locked on the schedule. Arthur will
                  review your project notes and send confirmation details.
                </p>

                <div className="border-t border-b border-[#E4E4DF] py-4 space-y-2.5 text-sm mb-6">
                  <div className="flex justify-between gap-4">
                    <span className="text-[#525760]">Reference ID</span>
                    <span className="font-mono-num font-medium text-[#141619]">
                      {confirmedRef.id}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#525760]">Date</span>
                    <span className="font-mono-num text-[#141619]">
                      {confirmedRef.date}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#525760]">Window</span>
                    <span className="font-mono-num text-[#141619]">
                      {confirmedRef.windowLabel}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#525760]">Service</span>
                    <span className="text-[#141619]">{confirmedRef.category}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmedRef(null)}
                    className="px-4 py-2.5 text-sm font-medium bg-[#1B4332] text-white rounded-lg hover:bg-[#143326] transition-colors"
                  >
                    Book Another Visit
                  </button>
                  <button
                    type="button"
                    onClick={onOpenMyBookings}
                    className="px-4 py-2.5 text-sm font-medium text-[#141619] border border-[#E4E4DF] rounded-lg hover:border-[#1B4332] transition-colors"
                  >
                    View My Bookings
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white border border-[#E4E4DF] rounded-xl p-6 sm:p-8 space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E4E4DF]">
                  <div className="flex items-center gap-2 text-xs text-[#525760]">
                    <Calendar className="w-4 h-4 text-[#1B4332]" />
                    <span className="font-mono-num font-medium text-[#141619]">
                      {selectedDate}
                    </span>
                    <span aria-hidden="true">·</span>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{SLOT_LABELS[selectedSlotKey].window}</span>
                  </div>

                  {!user && (
                    <button
                      type="button"
                      onClick={onSignInRequested}
                      className="text-xs font-medium text-[#1B4332] hover:underline underline-offset-4"
                    >
                      Sign in with Google to track status
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="appt-name"
                      className="block text-xs font-medium text-[#141619] mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="appt-name"
                      type="text"
                      required
                      value={clientName || user?.displayName || ''}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Jordan Miller"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E4DF] rounded-lg text-[#141619] min-h-[42px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="appt-phone"
                      className="block text-xs font-medium text-[#141619] mb-1.5"
                    >
                      Phone Number
                    </label>
                    <input
                      id="appt-phone"
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="(503) 555-0142"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E4DF] rounded-lg text-[#141619] min-h-[42px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="appt-email"
                      className="block text-xs font-medium text-[#141619] mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="appt-email"
                      type="email"
                      required
                      value={clientEmail || user?.email || ''}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="jordan@example.com"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E4DF] rounded-lg text-[#141619] min-h-[42px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="appt-address"
                      className="block text-xs font-medium text-[#141619] mb-1.5"
                    >
                      Service Street Address
                    </label>
                    <input
                      id="appt-address"
                      type="text"
                      required
                      value={serviceAddress}
                      onChange={(e) => setServiceAddress(e.target.value)}
                      placeholder="2418 NE Hancock St, Portland"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E4DF] rounded-lg text-[#141619] min-h-[42px]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="appt-desc"
                    className="block text-xs font-medium text-[#141619] mb-1.5"
                  >
                    Scope of Repairs / Punch List
                  </label>
                  <textarea
                    id="appt-desc"
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Example: Re-hang two sticking upstairs bedroom doors, replace kitchen faucet, and patch a 12-inch drywall opening behind the laundry sink."
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E4DF] rounded-lg text-[#141619] leading-relaxed"
                  />
                </div>

                {errorMsg && (
                  <div
                    role="alert"
                    className="px-4 py-3 text-xs font-medium text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-lg"
                  >
                    {errorMsg}
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-xs text-[#525760]">
                    No upfront deposit required. Pay on completion.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting || isSlotTaken}
                    className="px-6 py-3 text-sm font-medium bg-[#1B4332] text-white rounded-lg hover:bg-[#143326] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
                  >
                    {submitting ? 'Reserving Window...' : 'Confirm Appointment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
