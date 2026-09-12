import { BarChart3, Calculator, Dumbbell, Info, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router';
import { PROFILE_LIMITS } from '../profile/form';
import { Page } from '../../shared/ui';

export function AboutPage() {
  return (
    <Page title="How it works" subtitle="See the formulas, assumptions, and terms behind your planner." action={<Link className="button secondary" to="/calculate"><Calculator size={16} /> Open calculator</Link>}>
      <div className="about-layout">
        <main className="about-main">
          <section className="about-card about-notice" aria-labelledby="about-safety-title">
            <ShieldAlert size={21} />
            <div>
              <p className="eyebrow">Important boundary</p>
              <h2 id="about-safety-title">Useful estimates, not medical advice.</h2>
              <p>FORM uses a simple heuristic for generally healthy people. It does not account for pregnancy, medical conditions, medication, eating-disorder history, or sport-specific needs.</p>
              <p>If a result seems wrong, or you need nutrition guidance for a health condition, check with a qualified clinician or registered dietitian.</p>
            </div>
          </section>

          <section className="about-card" aria-labelledby="about-calculations-title">
            <div className="section-heading"><div><p className="eyebrow">Nutrition estimates</p><h2 id="about-calculations-title">What the numbers mean</h2></div><Calculator size={19} /></div>
            <p className="about-intro">Rule version <code>MVP-2026.1</code>. These are editable starting points, not promises about what your body needs.</p>
            <div className="formula-list">
              <div className="formula-item"><strong>1. Resting energy</strong><code>BMR = 10 × weight + 6.25 × height − 5 × age + sex constant</code><p>Weight is in kilograms and height is in centimetres. The sex constant is <strong>+5</strong> for male and <strong>−161</strong> for female.</p></div>
              <div className="formula-item"><strong>2. Daily calorie estimate</strong><code>calories = max(1,200, BMR × activity factor + goal adjustment)</code><p>Activity factors range from <strong>1.2</strong> for mostly sitting to <strong>1.9</strong> for athlete/high activity. Goal adjustments are <strong>−300</strong> for lose fat, <strong>+250</strong> for build muscle, <strong>0</strong> for maintain weight, and <strong>+100</strong> for general fitness. The result is rounded to the nearest 50.</p><p>The floor prevents this heuristic from displaying an extremely low number; it is not a claim that 1,200 calories is safe or appropriate for everyone.</p></div>
              <div className="formula-item"><strong>3. Macro starting points</strong><code>protein = weight × 1.8 or 1.6 · fat = weight × 0.8 · carbs = remaining calories</code><p>Protein uses <strong>1.8 g/kg</strong> for build muscle and <strong>1.6 g/kg</strong> otherwise. Fat uses <strong>0.8 g/kg</strong>. Carbohydrates fill what remains after protein and fat. The conversion uses 4 calories per gram for protein/carbohydrate and 9 for fat.</p></div>
              <div className="formula-item"><strong>4. BMI screening number</strong><code>BMI = weight (kg) ÷ height (m)²</code><p>BMI is shown separately from nutrition targets. It is a height-to-weight screening measure, not a diagnosis or a measure of body composition.</p></div>
            </div>
          </section>

          <section className="about-card" aria-labelledby="about-workouts-title">
            <div className="section-heading"><div><p className="eyebrow">Workout guidance</p><h2 id="about-workouts-title">How plans and recommendations work</h2></div><Dumbbell size={19} /></div>
            <ul className="about-list">
              <li><strong>Focus suggestion:</strong> a deterministic starting suggestion from experience and primary goal. You can replace it before saving.</li>
              <li><strong>Prescription:</strong> one exercise’s planned sets, reps or duration, rest, optional load, notes, and target RIR (reps in reserve).</li>
              <li><strong>Planned volume:</strong> the total number of planned work sets. It is not your actual workload.</li>
              <li><strong>Effort guidance:</strong> after two comparable completed sessions, repeated below-target work, drop-off, or very low RIR can suggest decreasing effort; repeated above-target work can suggest increasing it. Mixed evidence means hold. This is a simple heuristic, not a fatigue or readiness diagnosis.</li>
            </ul>
          </section>

          <section className="about-card" aria-labelledby="about-progress-title">
            <div className="section-heading"><div><p className="eyebrow">Progress</p><h2 id="about-progress-title">How the graph is calculated</h2></div><BarChart3 size={19} /></div>
            <p className="about-copy">For each prescription with logged reps or duration, the app divides actual dose by planned dose. It averages those prescription ratios, rounds the result, and shows the latest eight completed sessions with positive data. <strong>100%</strong> means the planned dose was completed.</p>
            <p className="about-copy">Load, RIR, and exact set details stay separate in the table. Editing a plan never rewrites an old record because each record stores a snapshot of the plan you followed.</p>
          </section>

          <section className="about-card" aria-labelledby="about-terms-title">
            <div className="section-heading"><div><p className="eyebrow">Terms</p><h2 id="about-terms-title">A few words we use</h2></div><Info size={19} /></div>
            <dl className="about-terms">
              <div><dt>Workout plan</dt><dd>A reusable recipe: focus, schedule, exercises, and prescriptions.</dd></div>
              <div><dt>Workout session</dt><dd>One dated use of a plan. It becomes a saved record when you save progress or mark it complete.</dd></div>
              <div><dt>Dose</dt><dd>The amount of an exercise: repetitions for strength work or seconds for duration work.</dd></div>
              <div><dt>RIR</dt><dd>Reps in reserve: your estimate of how many more good-form repetitions you could have done after a set.</dd></div>
              <div><dt>Estimate versus record</dt><dd>Profile estimates and plan recommendations can change. A saved historical record keeps the values and plan snapshot from that date.</dd></div>
            </dl>
          </section>

          <section className="about-card about-sources" aria-labelledby="about-sources-title">
            <p className="eyebrow">Sources and review status</p>
            <h2 id="about-sources-title">Where the conventions come from</h2>
            <ul className="about-list">
              <li><a href="https://pubmed.ncbi.nlm.nih.gov/2305711/" target="_blank" rel="noreferrer">Mifflin et al., 1990</a> — source of the resting-energy predictive equation used as the BMR-style starting point.</li>
              <li><a href="https://www.cdc.gov/bmi/about/index.html" target="_blank" rel="noreferrer">CDC BMI guidance</a> — source of the metric BMI formula and its screening boundary.</li>
              <li><a href="https://www.nal.usda.gov/programs/fnic" target="_blank" rel="noreferrer">USDA Food and Nutrition Information Center</a> — source of the 4/4/9 calorie-per-gram conversion convention.</li>
            </ul>
            <p className="fine-print">The activity factors, goal adjustments, macro multipliers, and calorie floor are product heuristics chosen for a low-friction MVP. They still need qualified health review before public release.</p>
          </section>
        </main>

        <aside className="about-side">
          <section className="side-card">
            <p className="eyebrow">Supported profile inputs</p>
            <div className="about-inputs">
              <div><strong>{PROFILE_LIMITS.age.min}–{PROFILE_LIMITS.age.max}</strong><span>years</span></div>
              <div><strong>{PROFILE_LIMITS.heightCm.min}–{PROFILE_LIMITS.heightCm.max}</strong><span>cm height</span></div>
              <div><strong>{PROFILE_LIMITS.weightKg.min}–{PROFILE_LIMITS.weightKg.max}</strong><span>kg body weight</span></div>
            </div>
            <p className="fine-print">These limits protect the estimate flow from unsupported values. They do not mean the formula is clinically suitable across every age or health situation.</p>
          </section>
          <section className="side-card privacy-card">
            <Info size={18} />
            <h3>Private by default</h3>
            <p>Your profile, plans, measurements, and workout records stay in this browser on this device. The app has no account or sync service.</p>
          </section>
        </aside>
      </div>
    </Page>
  );
}
