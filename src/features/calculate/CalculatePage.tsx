import { useState, type FormEvent } from 'react';
import { Calculator, Info } from 'lucide-react';
import { ACTIVITY_LABELS, GOALS, GOAL_LABELS, calculateEstimates, type ActivityLevel, type Goal, type Sex } from '../../domain';
import { PROFILE_LIMITS } from '../profile/form';
import { Field, Page } from '../../shared/ui';

interface CalculatorForm {
  age: string;
  sex: Sex;
  heightCm: string;
  weightKg: string;
  activityLevel: ActivityLevel;
  primaryGoal: Goal;
}

const INITIAL_FORM: CalculatorForm = {
  age: '',
  sex: 'female',
  heightCm: '',
  weightKg: '',
  activityLevel: 'moderate',
  primaryGoal: 'general-fitness',
};

export function CalculatePage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [estimate, setEstimate] = useState<ReturnType<typeof calculateEstimates> | null>(null);
  const [error, setError] = useState('');

  function update(field: keyof CalculatorForm, value: string) {
    setForm((current) => ({ ...current, [field]: value } as CalculatorForm));
    setEstimate(null);
    setError('');
  }

  function calculate(event: FormEvent) {
    event.preventDefault();
    const age = Number(form.age);
    const heightCm = Number(form.heightCm);
    const weightKg = Number(form.weightKg);
    const supported = Number.isInteger(age)
      && age >= PROFILE_LIMITS.age.min && age <= PROFILE_LIMITS.age.max
      && Number.isFinite(heightCm) && heightCm >= PROFILE_LIMITS.heightCm.min && heightCm <= PROFILE_LIMITS.heightCm.max
      && Number.isFinite(weightKg) && weightKg >= PROFILE_LIMITS.weightKg.min && weightKg <= PROFILE_LIMITS.weightKg.max;

    if (!supported) {
      setEstimate(null);
      setError(`Enter age ${PROFILE_LIMITS.age.min}–${PROFILE_LIMITS.age.max}, height ${PROFILE_LIMITS.heightCm.min}–${PROFILE_LIMITS.heightCm.max} cm, and weight ${PROFILE_LIMITS.weightKg.min}–${PROFILE_LIMITS.weightKg.max} kg.`);
      return;
    }

    setEstimate(calculateEstimates({ age, sex: form.sex, heightCm, weightKg, activityLevel: form.activityLevel, primaryGoal: form.primaryGoal }));
  }

  return (
    <Page title="Estimate calculator" subtitle="Try different inputs without changing your profile or saved plans." action={<span className="unit-label">Nothing is saved</span>}>
      <div className="settings-layout calculator-layout">
        <form className="settings-form" onSubmit={calculate}>
          <section className="editor-section calculator-form">
            <div className="section-heading"><div><p className="eyebrow">Inputs</p><h2>Build a quick estimate</h2></div><Calculator size={19} /></div>
            <div className="field-grid">
              <Field label="Age" suffix="years"><input required type="number" min={PROFILE_LIMITS.age.min} max={PROFILE_LIMITS.age.max} step="1" value={form.age} onChange={(event) => update('age', event.target.value)} placeholder="28" /></Field>
              <Field label="Sex"><select value={form.sex} onChange={(event) => update('sex', event.target.value)}><option value="female">Female</option><option value="male">Male</option></select></Field>
              <Field label="Height" suffix="cm"><input required type="number" min={PROFILE_LIMITS.heightCm.min} max={PROFILE_LIMITS.heightCm.max} step="0.1" value={form.heightCm} onChange={(event) => update('heightCm', event.target.value)} placeholder="172" /></Field>
              <Field label="Body weight" suffix="kg"><input required type="number" min={PROFILE_LIMITS.weightKg.min} max={PROFILE_LIMITS.weightKg.max} step="0.1" value={form.weightKg} onChange={(event) => update('weightKg', event.target.value)} placeholder="70" /></Field>
            </div>
            <div className="settings-split">
              <Field label="Activity"><select value={form.activityLevel} onChange={(event) => update('activityLevel', event.target.value)}>{Object.entries(ACTIVITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
              <Field label="Primary goal"><select value={form.primaryGoal} onChange={(event) => update('primaryGoal', event.target.value)}>{GOALS.map((goal) => <option key={goal} value={goal}>{GOAL_LABELS[goal]}</option>)}</select></Field>
            </div>
            {error && <p className="form-error global-error" role="alert">{error}</p>}
            <div className="settings-actions"><button className="button primary" type="submit">Calculate estimate <Calculator size={16} /></button></div>
            <p className="fine-print">This calculator uses the same MVP-2026.1 heuristic as the planner, but does not save your inputs or change any existing estimate.</p>
          </section>
        </form>

        <aside className="settings-side">
          {estimate ? <div className="side-card estimate-card calculator-result">
            <div className="section-heading"><div><p className="eyebrow">Your estimate</p><h3>{estimate.dailyCalories.toLocaleString()} <small>calories/day</small></h3></div><span className="target-icon"><Calculator size={18} /></span></div>
            <div className="saved-macros"><span>{estimate.proteinGrams}g protein</span><span>{estimate.carbohydrateGrams}g carbohydrates</span><span>{estimate.fatGrams}g fat</span></div>
            <div className="bmi-row"><span>BMI estimate <small>body mass index</small></span><strong>{estimate.bmi.toFixed(1)}</strong></div>
            <p className="fine-print">A starting estimate, not medical advice or a per-workout allowance.</p>
          </div> : <div className="side-card calculator-empty"><Calculator size={20} /><h3>Your result will appear here</h3><p>Enter the basics and calculate a fresh estimate without affecting your saved profile.</p></div>}
          <div className="side-card privacy-card"><Info size={18} /><h3>Calculation only</h3><p>Your inputs stay in this page’s temporary state. Use <strong>How it works</strong> to see the formulas, sources, and boundaries.</p></div>
        </aside>
      </div>
    </Page>
  );
}
