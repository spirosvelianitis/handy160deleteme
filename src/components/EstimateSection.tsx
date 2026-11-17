import React, { useEffect, useMemo, useState } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Calculator, CheckCircle2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ESTIMATOR_PRESETS } from '../lib/seedData';
import { generateDocId, validateEstimateInput } from '../lib/validation';

interface EstimateSectionProps {
  user: User | null;
  preselectedJobType?: string;
  preselectedNotes?: string;
}

export const EstimateSection: React.FC<EstimateSectionProps> = ({
  user,
  preselectedJobType,
  preselectedNotes,
}) => {
  const [presetId, setPresetId] = useState(ESTIMATOR_PRESETS[0].id);
  const [units, setUnits] = useState(ESTIMATOR_PRESETS[0].defaultUnits);
  const [complexity, setComplexity] = useState<'standard' | 'moderate' | 'complex'>(
    'standard'
  );
  const [materialsBy, setMaterialsBy] = useState<'client' | 'handyman'>('handyman');
  const [urgency, setUrgency] = useState<'flexible' | 'priority'>('flexible');

  const [clientName, setClientName] = useState(user?.displayName || '');
  const [clientEmail, setClientEmail] = useState(user?.email || '');
  const [clientPhone, setClientPhone] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [projectNotes, setProjectNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedQuote, setSubmittedQuote] = useState<{
    id: string;
    range: string;
    jobType: string;
  } | null>(null);

  useEffect(() => {
    if (preselectedJobType) {
      const match = ESTIMATOR_PRESETS.find((p) => p.id === preselectedJobType);
      if (match) {
        setPresetId(match.id);
        setUnits(match.defaultUnits);
      }
    }
    if (preselectedNotes) {
      setProjectNotes(preselectedNotes);
    }
  }, [preselectedJobType, preselectedNotes]);

  const activePreset = useMemo(
    () => ESTIMATOR_PRESETS.find((p) => p.id === presetId) || ESTIMATOR_PRESETS[0],
    [presetId]
  );

  const calculation = useMemo(() => {
    const complexityMult =
      complexity === 'standard' ? 1 : complexity === 'moderate' ? 1.25 : 1.55;
    const urgencyMult = urgency === 'priority' ? 1.15 : 1;

    const laborMid = Math.round(
      (activePreset.baseLabor + activePreset.perUnitLabor * units) *
        complexityMult *
        urgencyMult
    );
    const materialsAllowance =
      materialsBy === 'handyman'
        ? Math.round(activePreset.perUnitMaterials * units * complexityMult)
        : 0;

    const minTotal = Math.round((laborMid * 0.9 + materialsAllowance * 0.85) / 5) * 5;
    const maxTotal = Math.round((laborMid * 1.15 + materialsAllowance * 1.15) / 5) * 5;

    const hoursRaw = Math.max(
      1.5,
      Math.round(activePreset.hoursPerUnit * units * complexityMult * 2) / 2
    );
    const hoursLabel =
      hoursRaw <= 4
        ? `${hoursRaw} – ${hoursRaw + 1} hrs`
        : `${Math.floor(hoursRaw)} – ${Math.ceil(hoursRaw + 1.5)} hrs`;

    return {
      laborMid,
      materialsAllowance,
      minTotal,
      maxTotal,
      hoursLabel,
    };
  }, [activePreset, units, complexity, materialsBy, urgency]);

  const handlePresetChange = (nextId: string) => {
    setPresetId(nextId);
    const next = ESTIMATOR_PRESETS.find((p) => p.id === nextId);
    if (next) {
      setUnits(next.defaultUnits);
    }
  };

  const handleSubmitEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const effectiveName = clientName.trim() || user?.displayName || '';
    const effectiveEmail = clientEmail.trim() || user?.email || '';

    const validationError = validateEstimateInput({
      clientName: effectiveName,
      clientEmail: effectiveEmail,
      clientPhone,
      neighborhood,
      projectNotes,
    });

    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setSubmitting(true);
    const estimateId = generateDocId('est');

    try {
      await setDoc(doc(db, 'estimates', estimateId), {
        userId: user ? user.uid : 'guest',
        clientName: effectiveName,
        clientEmail: effectiveEmail,
        clientPhone: clientPhone.trim(),
        neighborhood: neighborhood.trim(),
        jobType: activePreset.label,
        scopeUnits: Math.round(units),
        complexity,
        materialsBy,
        urgency,
        estimatedMin: calculation.minTotal,
        estimatedMax: calculation.maxTotal,
        estimatedHours: calculation.hoursLabel,
        projectNotes: projectNotes.trim(),
        status: 'requested',
        formalQuoteAmount: 0,
        adminNotes: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSubmittedQuote({
        id: estimateId,
        range: `$${calculation.minTotal.toLocaleString()} – $${calculation.maxTotal.toLocaleString()}`,
        jobType: activePreset.label,
      });
      setProjectNotes('');
      setClientPhone('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('permission')) {
        try {
          handleFirestoreError(err, OperationType.CREATE, `estimates/${estimateId}`);
        } catch {
          setErrorMsg('Unable to save estimate request. Please verify your inputs and try again.');
        }
      } else {
        setErrorMsg('Could not submit estimate request. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="estimates" className="py-16 lg:py-24 bg-white border-b border-[#E4E4DF]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-medium text-[#1B4332] mb-2">
            Transparent Pricing &amp; Estimates
          </p>
          <h2
            className="font-display text-3xl font-bold tracking-tight text-[#141619] mb-3"
            style={{ textWrap: 'balance' }}
          >
            Instant Ballpark Calculator &amp; Written Quote
          </h2>
          <p className="text-sm text-[#525760] leading-relaxed">
            Configure your project scope to preview a realistic labor and
            materials range, then submit for a formal fixed-price or not-to-exceed
            estimate.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Interactive Scope Calculator */}
          <div className="lg:col-span-6 bg-[#F8F8F6] border border-[#E4E4DF] rounded-xl p-6 sm:p-8 space-y-6">
            <div>
              <label
                htmlFor="est-job-type"
                className="block text-xs font-medium text-[#141619] mb-2"
              >
                Project Type
              </label>
              <select
                id="est-job-type"
                value={presetId}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E4DF] rounded-lg text-[#141619] min-h-[42px]"
              >
                {ESTIMATOR_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <label htmlFor="est-units" className="font-medium text-[#141619]">
                  Scope Quantity ({activePreset.unitLabel})
                </label>
                <span className="font-mono-num font-semibold text-[#1B4332]">
                  {units} {activePreset.unitLabel}
                </span>
              </div>
              <input
                id="est-units"
                type="range"
                min={activePreset.minUnits}
                max={activePreset.maxUnits}
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
                className="w-full accent-[#1B4332] cursor-pointer"
              />
              <div className="flex justify-between font-mono-num text-[11px] text-[#525760] mt-1">
                <span>{activePreset.minUnits}</span>
                <span>{activePreset.maxUnits}</span>
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-[#141619] mb-2">
                Site &amp; Finish Complexity
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['standard', 'moderate', 'complex'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setComplexity(level)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border capitalize transition-colors min-h-[40px] ${
                      complexity === level
                        ? 'bg-[#141619] border-[#141619] text-white'
                        : 'bg-white border-[#E4E4DF] text-[#525760] hover:text-[#141619]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-medium text-[#141619] mb-2">
                  Materials Supply
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMaterialsBy('handyman')}
                    className={`px-2.5 py-2 text-xs font-medium rounded-lg border transition-colors min-h-[40px] ${
                      materialsBy === 'handyman'
                        ? 'bg-[#141619] border-[#141619] text-white'
                        : 'bg-white border-[#E4E4DF] text-[#525760]'
                    }`}
                  >
                    Arthur Sources
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaterialsBy('client')}
                    className={`px-2.5 py-2 text-xs font-medium rounded-lg border transition-colors min-h-[40px] ${
                      materialsBy === 'client'
                        ? 'bg-[#141619] border-[#141619] text-white'
                        : 'bg-white border-[#E4E4DF] text-[#525760]'
                    }`}
                  >
                    On-Site
                  </button>
                </div>
              </div>

              <div>
                <span className="block text-xs font-medium text-[#141619] mb-2">
                  Timeline
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setUrgency('flexible')}
                    className={`px-2.5 py-2 text-xs font-medium rounded-lg border transition-colors min-h-[40px] ${
                      urgency === 'flexible'
                        ? 'bg-[#141619] border-[#141619] text-white'
                        : 'bg-white border-[#E4E4DF] text-[#525760]'
                    }`}
                  >
                    Flexible
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgency('priority')}
                    className={`px-2.5 py-2 text-xs font-medium rounded-lg border transition-colors min-h-[40px] ${
                      urgency === 'priority'
                        ? 'bg-[#141619] border-[#141619] text-white'
                        : 'bg-white border-[#E4E4DF] text-[#525760]'
                    }`}
                  >
                    Priority
                  </button>
                </div>
              </div>
            </div>

            {/* Live Estimate Readout */}
            <div className="pt-5 border-t border-[#E4E4DF]">
              <div className="flex items-center justify-between text-xs text-[#525760] mb-1.5">
                <span>Estimated Ballpark Total</span>
                <span className="font-mono-num">{calculation.hoursLabel}</span>
              </div>
              <div className="font-mono-num text-3xl font-semibold text-[#141619] tracking-tight mb-4">
                ${calculation.minTotal.toLocaleString()} – $
                {calculation.maxTotal.toLocaleString()}
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs border-t border-[#E4E4DF] pt-3">
                <div>
                  <span className="text-[#525760] block">Labor Midpoint</span>
                  <span className="font-mono-num font-medium text-[#141619]">
                    ${calculation.laborMid.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[#525760] block">Materials Allowance</span>
                  <span className="font-mono-num font-medium text-[#141619]">
                    {materialsBy === 'handyman'
                      ? `~$${calculation.materialsAllowance.toLocaleString()}`
                      : '$0 (Client Supplied)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Submit for Formal Written Estimate */}
          <div className="lg:col-span-6">
            {submittedQuote ? (
              <div className="bg-[#F8F8F6] border border-[#1B4332]/30 rounded-xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-[#1B4332]" />
                  <h3 className="font-display text-2xl font-bold text-[#141619]">
                    Estimate Request Sent
                  </h3>
                </div>
                <p className="text-sm text-[#525760] leading-relaxed mb-6">
                  Arthur has received your scope breakdown and will follow up with
                  a formal written quote within 1 business day.
                </p>
                <div className="border-t border-b border-[#E4E4DF] py-4 space-y-2 text-sm mb-6">
                  <div className="flex justify-between">
                    <span className="text-[#525760]">Estimate ID</span>
                    <span className="font-mono-num text-[#141619]">
                      {submittedQuote.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#525760]">Project Type</span>
                    <span className="text-[#141619]">{submittedQuote.jobType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#525760]">Ballpark Range</span>
                    <span className="font-mono-num font-medium text-[#141619]">
                      {submittedQuote.range}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmittedQuote(null)}
                  className="px-4 py-2.5 text-sm font-medium bg-[#1B4332] text-white rounded-lg hover:bg-[#143326] transition-colors"
                >
                  Create Another Estimate
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitEstimate}
                className="bg-white border border-[#E4E4DF] rounded-xl p-6 sm:p-8 space-y-4"
              >
                <div className="flex items-center gap-2 pb-4 border-b border-[#E4E4DF]">
                  <Calculator className="w-4 h-4 text-[#1B4332]" />
                  <h3 className="font-display text-lg font-semibold text-[#141619]">
                    Request Written Estimate
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="est-name"
                      className="block text-xs font-medium text-[#141619] mb-1.5"
                    >
                      Your Name
                    </label>
                    <input
                      id="est-name"
                      type="text"
                      required
                      value={clientName || user?.displayName || ''}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Taylor Brooks"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E4DF] rounded-lg text-[#141619] min-h-[42px]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="est-phone"
                      className="block text-xs font-medium text-[#141619] mb-1.5"
                    >
                      Phone Number
                    </label>
                    <input
                      id="est-phone"
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="(503) 555-0181"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E4DF] rounded-lg text-[#141619] min-h-[42px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="est-email"
                      className="block text-xs font-medium text-[#141619] mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="est-email"
                      type="email"
                      required
                      value={clientEmail || user?.email || ''}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="taylor@example.com"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E4DF] rounded-lg text-[#141619] min-h-[42px]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="est-hood"
                      className="block text-xs font-medium text-[#141619] mb-1.5"
                    >
                      Neighborhood / Zip
                    </label>
                    <input
                      id="est-hood"
                      type="text"
                      required
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Irvington, 97212"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E4DF] rounded-lg text-[#141619] min-h-[42px]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="est-notes"
                    className="block text-xs font-medium text-[#141619] mb-1.5"
                  >
                    Dimensions, Materials &amp; Project Details
                  </label>
                  <textarea
                    id="est-notes"
                    rows={4}
                    required
                    value={projectNotes}
                    onChange={(e) => setProjectNotes(e.target.value)}
                    placeholder="Share approximate measurements, room access notes, or preferred finishes."
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3 text-sm font-medium bg-[#1B4332] text-white rounded-lg hover:bg-[#143326] disabled:opacity-50 transition-colors min-h-[44px]"
                >
                  {submitting
                    ? 'Submitting Request...'
                    : `Send Formal Estimate Request ($${calculation.minTotal}–$${calculation.maxTotal})`}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
