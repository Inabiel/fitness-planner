import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import {
  ACTIVITY_LABELS,
  EXPERIENCE_LABELS,
  GOALS,
  GOAL_LABELS,
  calculateEstimates,
  type Profile,
} from '../../domain';
import { now, saveProfile as saveProfileRecord } from '../../data/db';
import { Field } from '../../shared/ui';
import {
  emptyProfileForm,
  formToCalculationProfile,
  isCompleteProfileForm,
  profileToForm,
  type ProfileForm,
  type ProfileFormValue,
  positiveInteger,
  positiveNumber,
} from './form';

interface OnboardingProps {
  existing: Profile | undefined;
}

type FormErrors = Record<string, string>;
const ONBOARDING_STEPS = ['Baseline', 'Context', 'Goals', 'Review'] as const;
const LAST_STEP = ONBOARDING_STEPS.length - 1;

export function Onboarding({ existing }: OnboardingProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(existing ? LAST_STEP : 0);
  const [saving, setSaving] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState<ProfileForm>(() => existing ? profileToForm(existing) : emptyProfileForm());
  const estimate = useMemo(
    () => isCompleteProfileForm(form) ? calculateEstimates(formToCalculationProfile(form)) : null,
    [form],
  );

  useEffect(() => {
    if (!confirmModalOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) setConfirmModalOpen(false);
    }

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [confirmModalOpen, saving]);

  function update(field: keyof ProfileForm, value: ProfileFormValue) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  }

  function validateCurrentStep(): boolean {
    const next: FormErrors = {};

    if (step === 0) {
      if (!form.name.trim()) next.name = 'Add your name.';
      if (!positiveInteger(form.age) || Number(form.age) < 13 || Number(form.age) > 100) next.age = 'Enter an age from 13 to 100.';
      if (!form.sex) next.sex = 'Choose an option.';
      if (!positiveNumber(form.heightCm) || Number(form.heightCm) < 100 || Number(form.heightCm) > 250) next.heightCm = 'Enter height from 100–250 cm.';
      if (!positiveNumber(form.weightKg) || Number(form.weightKg) < 30 || Number(form.weightKg) > 300) next.weightKg = 'Enter weight from 30–300 kg.';
    }

    if (step === 1) {
      if (!form.activityLevel) next.activityLevel = 'Choose an activity level.';
      if (!form.experience) next.experience = 'Choose your experience.';
    }

    if (step === 2) {
      if (!form.primaryGoal) next.primaryGoal = 'Choose one primary goal.';
      if (form.primaryGoal && form.secondaryGoals.includes(form.primaryGoal)) next.secondaryGoals = 'Secondary goals cannot duplicate your primary goal.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function nextStep() {
    if (validateCurrentStep()) setStep((current) => Math.min(LAST_STEP, current + 1));
  }

  function submitProfile(event: FormEvent) {
    event.preventDefault();
    if (step < LAST_STEP) {
      nextStep();
      return;
    }
    if (!isCompleteProfileForm(form)) {
      setStep(0);
      return;
    }

    setError('');
    setConfirmModalOpen(true);
  }

  async function saveProfile() {
    if (!isCompleteProfileForm(form)) {
      setConfirmModalOpen(false);
      setStep(0);
      return;
    }

    setSaving(true);
    setError('');
    const profile: Profile = {
      id: 'profile',
      ...formToCalculationProfile(form),
      secondaryGoals: form.secondaryGoals,
      exerciseOrder: existing?.exerciseOrder,
      updatedAt: now(),
      revision: existing ? existing.revision + 1 : 1,
    };

    try {
      await saveProfileRecord(profile);
      navigate('/');
    } catch {
      setError('Your profile could not be saved. Your entries are still here—try again.');
    } finally {
      setSaving(false);
    }
  }

  const title = getStepTitle(step);
  const description = getStepDescription(step);

  return (
    <div className="onboarding-page">
      <header className="onboarding-top">
        <Link to="/onboarding" className="brand"><span className="brand-mark">F</span><span>form</span></Link>
        <span className="muted">Private by default · saved on this device</span>
      </header>
      <main className="onboarding-main">
        <OnboardingStepper currentStep={step} />
        <section className="step-card" aria-labelledby="onboarding-title">
          <div className="step-progress"><span>Getting started</span><span>0{step + 1} / 0{ONBOARDING_STEPS.length}</span></div>
          <form onSubmit={submitProfile}>
            <div className="step-heading">
              <p className="eyebrow">Your fitness profile</p>
              <h2 id="onboarding-title">{title}</h2>
              <p className="muted">{description}</p>
            </div>
            {step === 0 && <PersonalStep form={form} errors={errors} update={update} />}
            {step === 1 && <ContextStep form={form} errors={errors} update={update} />}
            {step === 2 && <GoalsStep form={form} errors={errors} update={update} />}
            {step === LAST_STEP && <ReviewStep form={form} estimate={estimate} />}
            <div className="form-actions">
              {step > 0 && <button type="button" className="button ghost" onClick={() => setStep((current) => current - 1)}><ArrowLeft size={16} /> Back</button>}
              {step < LAST_STEP ? <button type="button" className="button primary next-button" onClick={nextStep}>Continue <ArrowRight size={16} /></button> : <button type="submit" className="button primary next-button" disabled={saving}>{saving ? 'Saving…' : existing ? 'Save changes' : 'Open my planner'} <ArrowRight size={16} /></button>}
            </div>
          </form>
        </section>
        {confirmModalOpen && <ReviewConfirmationModal existing={Boolean(existing)} form={form} error={error} saving={saving} onCancel={() => setConfirmModalOpen(false)} onConfirm={saveProfile} />}
      </main>
    </div>
  );
}

function OnboardingStepper({ currentStep }: { currentStep: number }) {
  return (
    <nav className="onboarding-stepper" aria-label="Onboarding steps">
      <ol>
        {ONBOARDING_STEPS.map((label, index) => {
          const complete = index < currentStep;
          const current = index === currentStep;
          const state = complete ? 'is-complete' : current ? 'is-current' : '';

          return (
            <li className={`onboarding-step ${state}`} key={label} aria-current={current ? 'step' : undefined}>
              <span className="stepper-node" aria-hidden="true">{complete ? <Check size={15} /> : index + 1}</span>
              <span>{label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ReviewConfirmationModal({ existing, form, error, saving, onCancel, onConfirm }: { existing: boolean; form: ProfileForm; error: string; saving: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-backdrop">
      <div className="review-confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="review-confirmation-title">
        <div className="confirmation-icon"><Check size={20} /></div>
        <p className="eyebrow">Final review</p>
        <h2 id="review-confirmation-title">{existing ? 'Save these profile changes?' : 'Open your planner?'}</h2>
        <p className="muted">{existing ? 'Your updated baseline will be saved. Existing plan estimates will stay as they are.' : 'Your profile will be saved locally and used to personalize your planner.'}</p>
        <div className="confirmation-summary"><strong>{form.name || 'Your profile'}</strong><span>{form.age} years · {form.heightCm} cm · {form.weightKg} kg</span></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="button ghost" onClick={onCancel} disabled={saving} autoFocus>Review again</button>
          <button type="button" className="button primary" onClick={onConfirm} disabled={saving}>{saving ? 'Saving…' : existing ? 'Confirm changes' : 'Confirm and open planner'} <ArrowRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}

function getStepTitle(step: number): string {
  switch (step) {
    case 0: return 'Let’s build your baseline.';
    case 1: return 'A little context helps.';
    case 2: return 'What are you working toward?';
    default: return 'Your starting point, at a glance.';
  }
}

function getStepDescription(step: number): string {
  switch (step) {
    case 0: return 'This stays in your browser and helps keep estimates grounded.';
    case 1: return 'There’s no perfect answer—pick what feels most like your current routine.';
    case 2: return 'Choose a primary goal, then add any supporting goals.';
    default: return 'Review these details before we open your planner.';
  }
}

interface StepProps {
  form: ProfileForm;
  errors: FormErrors;
  update: (field: keyof ProfileForm, value: ProfileFormValue) => void;
}

function PersonalStep({ form, errors, update }: StepProps) {
  return (
    <div className="field-grid">
      <Field label="Name" error={errors.name}><input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Alex" /></Field>
      <Field label="Age" suffix="years" error={errors.age}><input type="number" min="13" max="100" value={form.age} onChange={(event) => update('age', event.target.value)} placeholder="28" /></Field>
      <Field label="Sex" error={errors.sex}><select value={form.sex} onChange={(event) => update('sex', event.target.value)}><option value="">Choose an option</option><option value="female">Female</option><option value="male">Male</option></select></Field>
      <Field label="Height" suffix="cm" error={errors.heightCm}><input type="number" min="100" max="250" value={form.heightCm} onChange={(event) => update('heightCm', event.target.value)} placeholder="172" /></Field>
      <Field label="Body weight" suffix="kg" error={errors.weightKg}><input type="number" min="30" max="300" step="0.1" value={form.weightKg} onChange={(event) => update('weightKg', event.target.value)} placeholder="70" /></Field>
    </div>
  );
}

function ContextStep({ form, errors, update }: StepProps) {
  return (
    <div className="stack-fields">
      <Field label="Activity level" hint="Your movement outside planned workouts" error={errors.activityLevel}>
        <select autoFocus value={form.activityLevel} onChange={(event) => update('activityLevel', event.target.value)}>
          <option value="">Choose your usual week</option>
          {Object.entries(ACTIVITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </Field>
      <Field label="Training experience" hint="Use your current, not aspirational, level" error={errors.experience}>
        <div className="choice-grid">
          {Object.entries(EXPERIENCE_LABELS).map(([value, label]) => <label className={`choice-card ${form.experience === value ? 'selected' : ''}`} key={value}>
            <input type="radio" name="experience" value={value} checked={form.experience === value} onChange={(event) => update('experience', event.target.value)} />
            <span>{label}</span>
            <small>{value === 'beginner' ? 'New or returning' : value === 'intermediate' ? 'Consistent basics' : 'Confident and experienced'}</small>
          </label>)}
        </div>
      </Field>
    </div>
  );
}

function GoalsStep({ form, errors, update }: StepProps) {
  function toggleGoal(goal: (typeof GOALS)[number]) {
    const nextGoals = form.secondaryGoals.includes(goal)
      ? form.secondaryGoals.filter((item) => item !== goal)
      : [...form.secondaryGoals, goal];
    update('secondaryGoals', nextGoals);
  }

  return (
    <div className="stack-fields">
      <Field label="Primary fitness goal" hint="This guides your nutrition estimate" error={errors.primaryGoal}>
        <div className="goal-list">
          {GOALS.map((goal) => <label key={goal} className={`goal-row ${form.primaryGoal === goal ? 'selected' : ''}`}>
            <input autoFocus={goal === GOALS[0]} type="radio" name="primaryGoal" checked={form.primaryGoal === goal} onChange={() => update('primaryGoal', goal)} />
            <span><strong>{GOAL_LABELS[goal]}</strong><small>{getGoalDescription(goal)}</small></span>
            {form.primaryGoal === goal && <Check size={18} />}
          </label>)}
        </div>
      </Field>
      <Field label="Secondary goals" hint="Optional · choose as many as fit">
        <div className="secondary-grid">
          {GOALS.filter((goal) => goal !== form.primaryGoal).map((goal) => <label className={`tag-choice ${form.secondaryGoals.includes(goal) ? 'selected' : ''}`} key={goal}>
            <input type="checkbox" checked={form.secondaryGoals.includes(goal)} onChange={() => toggleGoal(goal)} />
            <span>{GOAL_LABELS[goal]}</span>
          </label>)}
        </div>
      </Field>
      {errors.secondaryGoals && <p className="form-error">{errors.secondaryGoals}</p>}
    </div>
  );
}

function getGoalDescription(goal: (typeof GOALS)[number]): string {
  switch (goal) {
    case 'lose-fat': return 'Create a sustainable energy deficit';
    case 'build-muscle': return 'Support strength and lean mass';
    case 'maintain-weight': return 'Keep your current weight steady';
    default: return 'Build a consistent, capable routine';
  }
}

function ReviewStep({ form, estimate }: { form: ProfileForm; estimate: ReturnType<typeof calculateEstimates> | null }) {
  return (
    <div className="review-stack">
      <div className="review-card">
        <span className="avatar large">{form.name.charAt(0).toUpperCase() || '?'}</span>
        <div><strong>{form.name || 'Your profile'}</strong><p>{form.age || '—'} years · {form.heightCm || '—'} cm · {form.weightKg || '—'} kg</p></div>
        <span className="review-ok"><Check size={16} /> Ready</span>
      </div>
      <div className="estimate-preview">
        <div className="section-heading"><div><p className="eyebrow">Your first estimate</p><h3>Useful, not absolute.</h3></div><Info size={18} /></div>
        {estimate ? <div className="mini-estimates"><div><strong>{estimate.dailyCalories.toLocaleString()}</strong><span>daily kcal</span></div><div><strong>{estimate.proteinGrams}g</strong><span>protein</span></div><div><strong>{estimate.bmi.toFixed(1)}</strong><span>BMI estimate</span></div></div> : <p className="muted">Complete the earlier steps to preview your estimate.</p>}
        <p className="fine-print">Uses the MVP rule: Mifflin–St Jeor, activity factor, a goal adjustment, and rounded daily macros. It is a starting point—not medical advice.</p>
      </div>
    </div>
  );
}
