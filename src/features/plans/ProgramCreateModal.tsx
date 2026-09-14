import { useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, Check, Dumbbell, FolderPlus, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { FOCUS_LABELS, dateIsValid, formatSchedule, localDate, type WorkoutPlan, type WorkoutProgram } from '../../domain';
import { now, saveProgram, uid, type PlannerData } from '../../data/db';
import { Field } from '../../shared/ui';
import { ProgramScheduleFields, type ProgramScheduleKind } from './ProgramScheduleFields';

export function ProgramCreateModal({ data, onClose }: { data: PlannerData; onClose: () => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [planIds, setPlanIds] = useState<string[]>([]);
  const [scheduleKind, setScheduleKind] = useState<ProgramScheduleKind>('independent');
  const [startsOn, setStartsOn] = useState(localDate());
  const [intervalDays, setIntervalDays] = useState('2');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const assignedPlanIds = new Set(data.programs.flatMap((program) => program.planIds));
  const selectedPlans = planIds.map((id) => data.plans.find((plan) => plan.id === id)).filter((plan): plan is WorkoutPlan => Boolean(plan));
  const availablePlans = data.plans.filter((plan) => !assignedPlanIds.has(plan.id) && !planIds.includes(plan.id));

  useEffect(() => {
    if (saving) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, saving]);

  function togglePlan(planId: string) {
    setPlanIds((current) => current.includes(planId) ? current.filter((id) => id !== planId) : [...current, planId]);
  }

  function buildProgram(): WorkoutProgram | undefined {
    if (!name.trim()) {
      setError('Name your program before saving.');
      return undefined;
    }
    const interval = Number(intervalDays);
    if (scheduleKind === 'rolling' && (!dateIsValid(startsOn) || !Number.isInteger(interval) || interval < 1 || interval > 30)) {
      setError('Choose a valid start date and an interval from 1 to 30 days.');
      return undefined;
    }
    const timestamp = now();
    return { id: uid(), name: name.trim(), planIds, ...(scheduleKind === 'rolling' ? { schedule: { kind: 'rolling' as const, startsOn, intervalDays: interval } } : {}), revision: 1, createdAt: timestamp, updatedAt: timestamp };
  }

  async function saveAndNavigate(destination: (program: WorkoutProgram) => string) {
    const program = buildProgram();
    if (!program) return;
    setSaving(true);
    setError('');
    try {
      await saveProgram(program);
      onClose();
      navigate(destination(program));
    } catch {
      setError('The program could not be saved. Your draft is still here—try again.');
    } finally {
      setSaving(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void saveAndNavigate((program) => `/programs/${program.id}`);
  }

  function createPlanHere() {
    void saveAndNavigate((program) => `/plans/new?programId=${program.id}`);
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <div className="review-confirmation-modal program-create-modal" role="dialog" aria-modal="true" aria-labelledby="program-create-title">
        <div className="program-modal-header">
          <div><div className="confirmation-icon"><FolderPlus size={20} /></div><p className="eyebrow">New program</p><h2 id="program-create-title">Keep workouts together</h2><p>Start with existing unassigned plans, or create the first plan in this program.</p></div>
          <button type="button" className="icon-button" onClick={onClose} disabled={saving} aria-label="Close new program dialog"><X size={18} /></button>
        </div>
        <form className="program-modal-form" onSubmit={submit}>
          <Field label="Program name" hint="Make the routine easy to recognize"><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Three-day strength" /></Field>
          <div className="program-modal-schedule"><div className="section-heading"><div><p className="eyebrow">Schedule</p><h3>Choose the program rhythm</h3></div><CalendarDays size={18} /></div><ProgramScheduleFields kind={scheduleKind} startsOn={startsOn} intervalDays={intervalDays} onKindChange={setScheduleKind} onStartsOnChange={setStartsOn} onIntervalDaysChange={setIntervalDays} previewPlans={selectedPlans} /></div>
          <div className="program-modal-plans">
            <div className="section-heading"><div><p className="eyebrow">Workouts</p><h3>Add unassigned plans</h3></div><span className="count-badge">{planIds.length}</span></div>
            {availablePlans.length ? <div className="program-plan-picker">{availablePlans.map((plan) => {
              const focus = plan.focus ?? plan.primaryTargetArea;
              return <label className="program-plan-option" key={plan.id}><input type="checkbox" checked={false} onChange={() => togglePlan(plan.id)} /><span className="program-plan-option-body"><strong>{plan.name}</strong><small>{FOCUS_LABELS[focus]} · {formatSchedule(plan.schedule)}</small></span></label>;
            })}</div> : <div className="inline-empty program-modal-empty"><Dumbbell size={19} /><span>{data.plans.length ? 'All existing plans are already assigned to a program.' : 'No plans yet—create one below.'}</span></div>}
          </div>
          {selectedPlans.length > 0 && <div className="program-modal-selected" aria-live="polite"><p className="field-label">Selected plans</p><div className="program-modal-selected-list">{selectedPlans.map((plan, index) => <div className="program-modal-selected-row" key={plan.id}><span className="program-order-number">{String(index + 1).padStart(2, '0')}</span><span className="program-order-main"><strong>{plan.name}</strong><small>{FOCUS_LABELS[plan.focus ?? plan.primaryTargetArea]}</small></span><button type="button" className="icon-button danger" onClick={() => togglePlan(plan.id)} aria-label={`Remove ${plan.name}`}><X size={16} /></button></div>)}</div></div>}
          {error && <p className="form-error global-error" role="alert">{error}</p>}
          <div className="modal-actions"><button type="button" className="button ghost" onClick={onClose} disabled={saving}>Cancel</button><button type="button" className="button secondary program-modal-create-plan" onClick={createPlanHere} disabled={saving}><Plus size={16} /> Create plan here</button><button type="submit" className="button primary" disabled={saving}>{saving ? 'Saving…' : 'Create program'} <Check size={16} /></button></div>
        </form>
      </div>
    </div>
  );
}
