import { useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Dumbbell, Info, Plus, Search, Sparkles, Target, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  AREA_LABELS,
  AREAS,
  FOCUS_LABELS,
  SPLITS,
  WORKOUT_STYLES,
  dateIsValid,
  localDate,
  snapshotEstimate,
  suggestArea,
  targetAreaForFocus,
  type Area,
  type Exercise,
  type Prescription,
  type Schedule,
  type WorkoutFocus,
  type WorkoutPlan,
} from '../../domain';
import { now, savePlan as savePlanRecord, uid, type AuthenticatedPlannerData } from '../../data/db';
import { EXERCISES } from '../../data/exercises';
import { normalizeExerciseOrder } from '../exercises/order';
import { weekdayLabel } from '../../shared/formatters';
import { EmptyState, Field, Page } from '../../shared/ui';
import { IntentionPreview } from './IntentionPreview';
import { createPresetPrescriptions, createRecommendedPrescriptions, WORKOUT_PRESETS, type WorkoutPreset } from './recommendations';

const EXERCISES_PER_PAGE = 6;
type ExerciseSort = 'popularity' | 'name-asc' | 'name-desc' | 'area' | 'custom';

export function PlanEditor({ data }: { data: AuthenticatedPlannerData }) {
  const { planId } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(planId);
  const source = data.plans.find((plan) => plan.id === planId);
  const [name, setName] = useState(source?.name ?? '');
  const [scheduleKind, setScheduleKind] = useState<'date' | 'weekly'>(source?.schedule.kind ?? 'weekly');
  const [date, setDate] = useState(source?.schedule.kind === 'date' ? source.schedule.date : localDate());
  const [weekday, setWeekday] = useState(String(source?.schedule.kind === 'weekly' ? source.schedule.weekday : 1));
  const [focus, setFocus] = useState<WorkoutFocus>(source?.focus ?? source?.primaryTargetArea ?? 'full-body');
  const [focusConfirmed, setFocusConfirmed] = useState(source?.focusConfirmed ?? false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => source?.prescriptions.length ? source.prescriptions : createRecommendedPrescriptions(source?.focus ?? source?.primaryTargetArea ?? 'full-body', data.profile.experience, data.profile.primaryGoal, EXERCISES, uid));
  const [search, setSearch] = useState('');
  const [filterArea, setFilterArea] = useState<Area | 'aerobic' | 'all'>('all');
  const [exerciseSort, setExerciseSort] = useState<ExerciseSort>(() => data.profile.exerciseOrder?.length ? 'custom' : 'popularity');
  const exerciseOrder = normalizeExerciseOrder(data.profile.exerciseOrder);
  const [libraryPage, setLibraryPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const suggestion = suggestArea(data.profile.primaryGoal, data.profile.experience);
  const filteredExercises = EXERCISES.filter((exercise) => matchesExercise(exercise, filterArea, search)).sort((a, b) => compareExercises(a, b, exerciseSort, exerciseOrder));
  const pageCount = Math.max(1, Math.ceil(filteredExercises.length / EXERCISES_PER_PAGE));
  const currentPage = Math.min(libraryPage, pageCount);
  const pageExercises = filteredExercises.slice((currentPage - 1) * EXERCISES_PER_PAGE, currentPage * EXERCISES_PER_PAGE);

  if (editing && !source) {
    return <Page title="Plan not found" subtitle="It may have been deleted, but any completed history is still safe."><EmptyState icon={<Info size={22} />} title="There’s no plan with that ID" body="Return to your plans to choose another session." action={<Link className="button secondary" to="/plans">Back to plans</Link>} /></Page>;
  }

  function addExercise(exercise: Exercise) {
    const prescription: Prescription = {
      id: uid(),
      exerciseId: exercise.id,
      sets: 3,
      dose: { kind: exercise.doseKind, value: exercise.doseKind === 'reps' ? 10 : 30 },
      restSeconds: 60,
      notes: '',
      recommendedLoadKg: null,
      targetRir: exercise.doseKind === 'reps' ? 2 : undefined,
    };
    setPrescriptions((current) => [...current, prescription]);
  }

  function updateLibrarySearch(value: string) {
    setSearch(value);
    setLibraryPage(1);
  }

  function updateLibraryFilter(value: Area | 'aerobic' | 'all') {
    setFilterArea(value);
    setLibraryPage(1);
  }

  function updateExerciseSort(value: ExerciseSort) {
    setExerciseSort(value);
    setLibraryPage(1);
  }

  function applyPreset(presetId: WorkoutPreset) {
    const preset = WORKOUT_PRESETS.find((item) => item.id === presetId);
    if (!preset || (preset.id === 'aerobic-flow' && focus !== 'aerobic')) return;

    setFocusConfirmed(true);
    setPrescriptions(createPresetPrescriptions(preset.id, focus, data.profile.experience, data.profile.primaryGoal, EXERCISES, uid));
    if (!name.trim()) setName(preset.name);
  }

  function selectFocus(nextFocus: WorkoutFocus) {
    setFocus(nextFocus);
    setFocusConfirmed(false);
    setPrescriptions(createRecommendedPrescriptions(nextFocus, data.profile.experience, data.profile.primaryGoal, EXERCISES, uid));
    if (!name.trim()) setName(`${FOCUS_LABELS[nextFocus]} day`);
  }

  function updatePrescription(id: string, patch: Partial<Prescription>) {
    setPrescriptions((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function movePrescription(id: string, direction: -1 | 1) {
    setPrescriptions((current) => {
      const index = current.findIndex((item) => item.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;

      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  async function savePlan(event: FormEvent) {
    event.preventDefault();
    const validationError = getPlanValidationError({ name, focusConfirmed, prescriptions, scheduleKind, date, weekday });
    if (validationError) {
      setError(validationError);
      return;
    }

    const schedule: Schedule = scheduleKind === 'date'
      ? { kind: 'date', date }
      : { kind: 'weekly', weekday: Number(weekday), startsOn: date };
    const plan: WorkoutPlan = {
      id: source?.id ?? uid(),
      name: name.trim(),
      revision: (source?.revision ?? 0) + 1,
      createdAt: source?.createdAt ?? now(),
      updatedAt: now(),
      primaryTargetArea: targetAreaForFocus(focus),
      focus,
      focusConfirmed: true,
      schedule,
      prescriptions,
      estimate: source?.estimate ?? snapshotEstimate(data.profile),
    };

    setSaving(true);
    setError('');
    try {
      await savePlanRecord(plan);
      navigate(`/plans/${plan.id}`);
    } catch {
      setError('The plan could not be saved. Your draft is still here—try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page title={editing ? 'Edit workout plan' : 'Build a workout plan'} subtitle="One focused session. Enough detail to follow it, not enough to overthink it." backTo="/plans">
      <form onSubmit={savePlan} className="editor-layout">
        <div className="editor-main">
          <section className="editor-section">
            <EditorHeading eyebrow="01 · Identity" title="Give it a name"><Dumbbell size={19} /></EditorHeading>
            <Field label="Plan name" hint="Make it easy to recognize on a busy day"><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Strong Monday" /></Field>
            <div className="preset-grid">{WORKOUT_PRESETS.map((preset) => <button type="button" className="preset-option" key={preset.id} onClick={() => applyPreset(preset.id)} disabled={preset.id === 'aerobic-flow' && focus !== 'aerobic'}><span><strong>{preset.name}</strong><small>{preset.id === 'aerobic-flow' && focus !== 'aerobic' ? 'Select Aerobic focus first' : preset.description}</small></span><ChevronRight size={16} /></button>)}</div>
          </section>
          <section className="editor-section">
            <EditorHeading eyebrow="02 · Focus" title="Choose the intention"><Target size={19} /></EditorHeading>
            <div className="suggestion-banner">
              <span className="suggestion-icon"><Sparkles size={17} /></span>
              <div><strong>Suggested: {AREA_LABELS[suggestion.area]}</strong><p>{suggestion.reason}</p></div>
              <button type="button" className="button small ghost" onClick={() => selectFocus(suggestion.area)}>Use suggestion</button>
            </div>
            <IntentionPreview focus={focus} />
            <div className="focus-group"><p className="field-label">Body part</p><div className="area-grid">
              {AREAS.map((area) => <button type="button" key={area} className={`area-option ${focus === area ? 'selected' : ''}`} onClick={() => selectFocus(area)}><span className={`area-dot ${area}`} /><span>{AREA_LABELS[area]}</span>{focus === area && <Check size={15} />}</button>)}
            </div></div>
            <div className="focus-group"><p className="field-label">Training split</p><div className="split-grid">
              {SPLITS.map((split) => <button type="button" key={split} className={`area-option ${focus === split ? 'selected' : ''}`} onClick={() => selectFocus(split)}><span className="area-dot full-body" /><span>{FOCUS_LABELS[split]}</span>{focus === split && <Check size={15} />}</button>)}
            </div></div>
            <div className="focus-group"><p className="field-label">Training style</p><div className="split-grid">
              {WORKOUT_STYLES.map((style) => <button type="button" key={style} className={`area-option ${focus === style ? 'selected' : ''}`} onClick={() => selectFocus(style)}><span className="area-dot full-body" /><span>{FOCUS_LABELS[style]}</span>{focus === style && <Check size={15} />}</button>)}
            </div></div>
            <label className="confirm-row"><input type="checkbox" checked={focusConfirmed} onChange={(event) => setFocusConfirmed(event.target.checked)} /><span><strong>I confirm {FOCUS_LABELS[focus].toLowerCase()} as this plan’s primary focus.</strong><small>Recommended exercises are loaded automatically and can still be customized.</small></span></label>
          </section>
          <section className="editor-section">
            <EditorHeading eyebrow="03 · Schedule" title="When will you do it?"><CalendarDays size={19} /></EditorHeading>
            <div className="segmented"><button type="button" className={scheduleKind === 'weekly' ? 'selected' : ''} onClick={() => setScheduleKind('weekly')}>Recurring weekday</button><button type="button" className={scheduleKind === 'date' ? 'selected' : ''} onClick={() => setScheduleKind('date')}>One calendar date</button></div>
            <div className="schedule-fields">
              {scheduleKind === 'weekly' && <Field label="Weekday"><select value={weekday} onChange={(event) => setWeekday(event.target.value)}>{[1, 2, 3, 4, 5, 6, 7].map((day) => <option key={day} value={day}>{weekdayLabel(day)}</option>)}</select></Field>}
              <Field label={scheduleKind === 'weekly' ? 'Starts on' : 'Session date'}><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
            </div>
          </section>
          <section className="editor-section">
            <EditorHeading eyebrow="04 · Exercises" title="Build the sequence"><span className="count-badge">{prescriptions.length}</span></EditorHeading>
            {prescriptions.length === 0 ? <div className="inline-empty"><Dumbbell size={19} /><span>Add movements from the library on the right.</span></div> : <div className="prescription-list">{prescriptions.map((prescription, index) => {
              const exercise = EXERCISES.find((item) => item.id === prescription.exerciseId);
              return exercise ? <PrescriptionEditor key={prescription.id} prescription={prescription} index={index} exercise={exercise} onChange={(patch) => updatePrescription(prescription.id, patch)} onMove={movePrescription} onRemove={() => setPrescriptions((current) => current.filter((item) => item.id !== prescription.id))} /> : null;
            })}</div>}
          </section>
          {error && <p className="form-error global-error" role="alert">{error}</p>}
          <div className="sticky-save"><button type="button" className="button ghost" onClick={() => navigate('/plans')}>Cancel</button><button className="button primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Save workout plan'} <ArrowRight size={16} /></button></div>
        </div>
        <ExerciseLibrary search={search} filterArea={filterArea} sort={exerciseSort} filteredExercises={pageExercises} totalExercises={filteredExercises.length} page={currentPage} pageCount={pageCount} onSearch={updateLibrarySearch} onFilter={updateLibraryFilter} onSort={updateExerciseSort} onPageChange={setLibraryPage} onAdd={addExercise} />
      </form>
    </Page>
  );
}

interface PlanValidationInput {
  name: string;
  focusConfirmed: boolean;
  prescriptions: Prescription[];
  scheduleKind: 'date' | 'weekly';
  date: string;
  weekday: string;
}

function getPlanValidationError(input: PlanValidationInput): string | undefined {
  if (!input.name.trim()) return 'Name your plan before saving.';
  if (!input.focusConfirmed) return 'Confirm the primary target area before saving.';
  if (!input.prescriptions.length) return 'Add at least one exercise.';
  if (!dateIsValid(input.date) || (input.scheduleKind === 'weekly' && !input.weekday)) return 'Choose a valid schedule date.';
  if (input.prescriptions.some((item) => item.sets < 1 || !Number.isInteger(item.sets) || item.dose.value <= 0 || item.restSeconds < 0)) return 'Check sets, reps or duration, and rest time. Values must be valid and positive where required.';
  return undefined;
}

function matchesExercise(exercise: Exercise, filterArea: Area | 'aerobic' | 'all', search: string): boolean {
  const matchesArea = filterArea === 'all' || filterArea === 'aerobic' || exercise.primaryAreas.includes(filterArea) || exercise.secondaryAreas.includes(filterArea);
  const matchesType = filterArea !== 'aerobic' || exercise.exerciseType === 'aerobic';
  const searchableText = `${exercise.name} ${exercise.equipment ?? ''} ${exercise.exerciseType ?? 'strength'}`.toLowerCase();
  return matchesArea && matchesType && searchableText.includes(search.toLowerCase());
}

function compareExercises(a: Exercise, b: Exercise, sort: ExerciseSort, exerciseOrder: readonly string[]): number {
  if (sort === 'name-asc') return a.name.localeCompare(b.name);
  if (sort === 'name-desc') return b.name.localeCompare(a.name);
  if (sort === 'area') return AREA_LABELS[a.primaryAreas[0]].localeCompare(AREA_LABELS[b.primaryAreas[0]]) || a.name.localeCompare(b.name);
  if (sort === 'custom') return exerciseOrder.indexOf(a.id) - exerciseOrder.indexOf(b.id);
  return a.popularityRank - b.popularityRank || a.name.localeCompare(b.name);
}

function sortLabel(sort: ExerciseSort): string {
  if (sort === 'name-asc') return 'name A–Z';
  if (sort === 'name-desc') return 'name Z–A';
  if (sort === 'area') return 'body part';
  if (sort === 'custom') return 'custom order';
  return 'most popular first';
}

function isExerciseSort(value: string): value is ExerciseSort {
  return value === 'popularity' || value === 'name-asc' || value === 'name-desc' || value === 'area' || value === 'custom';
}

function EditorHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{children}</div>;
}

function ExerciseLibrary({ search, filterArea, sort, filteredExercises, totalExercises, page, pageCount, onSearch, onFilter, onSort, onPageChange, onAdd }: { search: string; filterArea: Area | 'aerobic' | 'all'; sort: ExerciseSort; filteredExercises: Exercise[]; totalExercises: number; page: number; pageCount: number; onSearch: (value: string) => void; onFilter: (value: Area | 'aerobic' | 'all') => void; onSort: (value: ExerciseSort) => void; onPageChange: (page: number) => void; onAdd: (exercise: Exercise) => void }) {
  return <aside className="library-panel">
    <div className="library-head"><div><p className="eyebrow">Exercise library</p><h2>Choose your work</h2></div><span className="read-only">{totalExercises} available</span></div>
    <div className="search-box"><Search size={17} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search exercises" aria-label="Search exercises" /></div>
    <label className="library-sort"><span>Sort by</span><select value={sort} onChange={(event) => { if (isExerciseSort(event.target.value)) onSort(event.target.value); }} aria-label="Sort exercises"><option value="popularity">Most popular</option><option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option><option value="area">Body part</option><option value="custom">Custom order</option></select></label>
    <div className="filter-row"><button className={filterArea === 'all' ? 'active' : ''} type="button" onClick={() => onFilter('all')}>All</button><button className={filterArea === 'aerobic' ? 'active' : ''} type="button" onClick={() => onFilter('aerobic')}>Aerobic</button>{AREAS.filter((area) => area !== 'full-body').map((area) => <button className={filterArea === area ? 'active' : ''} type="button" key={area} onClick={() => onFilter(area)}>{AREA_LABELS[area]}</button>)}</div>
    <p className="library-results">{totalExercises} {totalExercises === 1 ? 'exercise' : 'exercises'} · {sortLabel(sort)}</p>
    {filteredExercises.length ? <div className="library-list">{filteredExercises.map((exercise) => <ExerciseLibraryItem key={exercise.id} exercise={exercise} onAdd={() => onAdd(exercise)} />)}</div> : <div className="inline-empty library-empty"><Dumbbell size={19} /><span>No exercises match this search.</span></div>}
    {pageCount > 1 && <nav className="library-pagination" aria-label="Exercise library pages"><button className="icon-button" type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="Previous exercise page"><ChevronLeft size={17} /></button><span>Page {page} of {pageCount}</span><button className="icon-button" type="button" onClick={() => onPageChange(page + 1)} disabled={page === pageCount} aria-label="Next exercise page"><ChevronRight size={17} /></button></nav>}
    <p className="fine-print library-footnote">Exercise demonstrations are represented as reviewed-content placeholders until licensed local media is supplied.</p>
  </aside>;
}

function PrescriptionEditor({ prescription, exercise, index, onChange, onMove, onRemove }: { prescription: Prescription; exercise: Exercise; index: number; onChange: (patch: Partial<Prescription>) => void; onMove: (id: string, direction: -1 | 1) => void; onRemove: () => void }) {
  return <div className="prescription-card">
    <div className="prescription-top"><span className="sequence-number">{String(index + 1).padStart(2, '0')}</span><div><strong>{exercise.name}</strong><span className="worked-label">Primary · {exercise.primaryAreas.map((area) => AREA_LABELS[area]).join(', ')}</span></div><div className="prescription-actions"><button type="button" className="icon-button" onClick={() => onMove(prescription.id, -1)} aria-label={`Move ${exercise.name} up`}><ChevronUp size={16} /></button><button type="button" className="icon-button" onClick={() => onMove(prescription.id, 1)} aria-label={`Move ${exercise.name} down`}><ChevronDown size={16} /></button><button type="button" className="icon-button danger" onClick={onRemove} aria-label={`Remove ${exercise.name}`}><Trash2 size={16} /></button></div></div>
    <div className="prescription-fields"><Field label="Sets"><input type="number" min="1" step="1" value={prescription.sets} onChange={(event) => onChange({ sets: Number(event.target.value) })} /></Field><Field label={prescription.dose.kind === 'reps' ? 'Reps' : 'Duration'} suffix={prescription.dose.kind === 'reps' ? 'each' : 'sec'}><input type="number" min="1" step="1" value={prescription.dose.value} onChange={(event) => onChange({ dose: { ...prescription.dose, value: Number(event.target.value) } })} /></Field><Field label="Start load" suffix="kg"><input type="number" min="0" step="0.5" value={prescription.recommendedLoadKg ?? ''} onChange={(event) => onChange({ recommendedLoadKg: event.target.value === '' ? null : Number(event.target.value) })} /></Field><Field label="Rest" suffix="sec"><input type="number" min="0" step="5" value={prescription.restSeconds} onChange={(event) => onChange({ restSeconds: Number(event.target.value) })} /></Field></div>
    {prescription.targetRir !== undefined && <p className="prescription-guidance">Target effort: finish with about {prescription.targetRir} reps in reserve.</p>}
    <input className="notes-input" value={prescription.notes} onChange={(event) => onChange({ notes: event.target.value })} placeholder="Optional coaching note" />
  </div>;
}

function ExerciseLibraryItem({ exercise, onAdd }: { exercise: Exercise; onAdd: () => void }) {
  const workedAreas = exercise.primaryAreas.map((area) => AREA_LABELS[area]).join(', ');
  const secondaryAreas = exercise.secondaryAreas.length ? ` · + ${exercise.secondaryAreas.map((area) => AREA_LABELS[area]).join(', ')}` : '';
  const equipmentLabel = exercise.equipment ? ` · ${exercise.equipment}` : '';
  const typeLabel = exercise.exerciseType === 'aerobic' ? ' · Aerobic' : '';
  return <article className="library-item"><div className="exercise-media unavailable"><Dumbbell size={19} /><span>Demo preview</span><small>Media pending</small></div><div className="library-item-body"><strong>{exercise.name}</strong><span className="worked-label">{workedAreas}{secondaryAreas}{equipmentLabel}{typeLabel}</span><button className="button small secondary full-width" type="button" onClick={onAdd}><Plus size={15} /> Add to plan</button></div></article>;
}
