import React, { useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Lock } from 'lucide-react';
import { getUpcomingScheduleDays, ScheduleSlotRecord } from '../lib/seedData';
import { SLOT_KEYS, SLOT_LABELS, SlotKey } from '../lib/validation';

interface ScheduleSectionProps {
  bookedSlots: Record<string, ScheduleSlotRecord>;
  selectedDate: string;
  selectedSlotKey: SlotKey;
  onSelectSlot: (dateStr: string, slotKey: SlotKey) => void;
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  bookedSlots,
  selectedDate,
  selectedSlotKey,
  onSelectSlot,
}) => {
  const [weekOffset, setWeekOffset] = useState<0 | 7>(0);

  const days = useMemo(() => getUpcomingScheduleDays(7, weekOffset), [weekOffset]);

  return (
    <section id="schedule" className="py-16 lg:py-24 bg-white border-b border-[#E4E4DF]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-medium text-[#1B4332] mb-2">
              Live Weekly Schedule
            </p>
            <h2
              className="font-display text-3xl font-bold tracking-tight text-[#141619]"
              style={{ textWrap: 'balance' }}
            >
              Check Open Windows &amp; Shop Hours
            </h2>
            <p className="text-sm text-[#525760] mt-2 max-w-xl">
              Select any open arrival window below to lock your appointment time.
              Monday–Saturday service hours; Sundays reserved for shop prep.
            </p>
          </div>

          {/* Week Switcher Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-[#F8F8F6] border border-[#E4E4DF] rounded-lg self-start">
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                weekOffset === 0
                  ? 'bg-white text-[#141619] shadow-xs border border-[#E4E4DF]/60'
                  : 'text-[#525760] hover:text-[#141619]'
              }`}
            >
              Next 7 Days
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset(7)}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                weekOffset === 7
                  ? 'bg-white text-[#141619] shadow-xs border border-[#E4E4DF]/60'
                  : 'text-[#525760] hover:text-[#141619]'
              }`}
            >
              Following Week
            </button>
          </div>
        </div>

        {/* 7-Day Availability Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {days.map((day) => {
            if (day.isSunday) {
              return (
                <div
                  key={day.dateStr}
                  className="rounded-xl border border-[#E4E4DF] bg-[#F8F8F6] p-4 flex flex-col justify-between min-h-[240px]"
                >
                  <div>
                    <div className="text-xs font-medium text-[#525760]">
                      {day.dayName}
                    </div>
                    <div className="font-display text-base font-semibold text-[#141619] mt-0.5">
                      {day.shortDate}
                    </div>
                  </div>
                  <div className="py-8 text-center">
                    <Lock className="w-4 h-4 text-[#525760] mx-auto mb-2" />
                    <div className="text-xs font-medium text-[#525760]">
                      Closed Sunday
                    </div>
                    <div className="text-[11px] text-[#525760]/80 mt-0.5">
                      Emergency only
                    </div>
                  </div>
                  <div className="text-[11px] text-[#525760] text-center border-t border-[#E4E4DF] pt-2">
                    Off Duty
                  </div>
                </div>
              );
            }

            return (
              <div
                key={day.dateStr}
                className="rounded-xl border border-[#E4E4DF] bg-white p-3.5 flex flex-col justify-between min-h-[240px]"
              >
                <div className="pb-3 mb-3 border-b border-[#E4E4DF] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-[#525760]">
                      {day.dayName}
                    </div>
                    <div className="font-display text-base font-semibold text-[#141619]">
                      {day.shortDate}
                    </div>
                  </div>
                  <Calendar className="w-4 h-4 text-[#525760]" />
                </div>

                <div className="space-y-2 flex-1">
                  {SLOT_KEYS.map((slotKey) => {
                    const slotId = `${day.dateStr}_${slotKey}`;
                    const record = bookedSlots[slotId];
                    const isSelected =
                      selectedDate === day.dateStr && selectedSlotKey === slotKey;
                    const meta = SLOT_LABELS[slotKey];

                    if (record) {
                      return (
                        <div
                          key={slotId}
                          className="w-full px-2.5 py-2 rounded-lg border border-[#E4E4DF] bg-[#F8F8F6] text-left"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-medium text-[#525760]">
                              {meta.label}
                            </span>
                            <span className="text-[11px] font-medium text-[#525760]">
                              {record.status === 'blocked' ? 'Blocked' : 'Booked'}
                            </span>
                          </div>
                          <div className="font-mono-num text-[11px] text-[#525760]/80 mt-0.5">
                            {meta.window.split(' – ')[0]}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={slotId}
                        type="button"
                        onClick={() => onSelectSlot(day.dateStr, slotKey)}
                        className={`w-full px-2.5 py-2 rounded-lg border text-left transition-colors min-h-[44px] ${
                          isSelected
                            ? 'bg-[#1B4332] border-[#1B4332] text-white'
                            : 'bg-white border-[#E4E4DF] hover:border-[#1B4332] text-[#141619]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-medium">
                            {meta.label}
                          </span>
                          <span
                            className={`text-[11px] font-medium inline-flex items-center gap-1 ${
                              isSelected ? 'text-white' : 'text-[#1B4332]'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Selected</span>
                              </>
                            ) : (
                              'Open'
                            )}
                          </span>
                        </div>
                        <div
                          className={`font-mono-num text-[11px] mt-0.5 ${
                            isSelected ? 'text-white/85' : 'text-[#525760]'
                          }`}
                        >
                          {meta.window.split(' – ')[0]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend with text labels (No color-only status) */}
        <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-[#525760]">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#1B4332]" />
            <span>Open — Click to pre-fill appointment</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1B4332]" />
            <span>Selected — Ready to confirm below</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#525760]" />
            <span>Booked / Blocked — Unavailable</span>
          </div>
        </div>
      </div>
    </section>
  );
};
