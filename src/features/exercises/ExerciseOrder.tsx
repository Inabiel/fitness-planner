import { useCallback, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Dumbbell, GripVertical } from 'lucide-react';
import { AREA_LABELS, AREAS, type Area, type Exercise, type Profile } from '../../domain';
import { now, saveProfile } from '../../data/db';
import { EXERCISES } from '../../data/exercises';
import { Page, Snackbar } from '../../shared/ui';
import { moveExerciseInOrder, normalizeExerciseOrder, reorderExerciseInOrder } from './order';

export function ExerciseOrder({ profile }: { profile: Profile }) {
  const [order, setOrder] = useState(() => normalizeExerciseOrder(profile.exerciseOrder));
  const orderRef = useRef(order);
  const itemRefs = useRef(new Map<string, HTMLElement>());
  const moveAnimations = useRef(new Map<string, Animation>());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterArea, setFilterArea] = useState<Area | 'aerobic' | 'all'>('all');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const dismissSnackbar = useCallback(() => setSnackbar(null), []);

  function move(id: string, direction: -1 | 1) {
    setSnackbar(null);
    setOrderWithAnimation(moveExerciseInOrder(orderRef.current, id, direction));
  }

  function setOrderWithAnimation(nextOrder: string[]) {
    if (nextOrder.every((id, index) => id === orderRef.current[index])) return;

    const firstPositions = new Map<string, DOMRect>();
    itemRefs.current.forEach((element, id) => firstPositions.set(id, element.getBoundingClientRect()));
    orderRef.current = nextOrder;
    setOrder(nextOrder);

    requestAnimationFrame(() => {
      itemRefs.current.forEach((element, id) => {
        const first = firstPositions.get(id);
        if (!first) return;

        const last = element.getBoundingClientRect();
        const x = first.left - last.left;
        const y = first.top - last.top;
        if (Math.abs(x) < 1 && Math.abs(y) < 1) return;

        moveAnimations.current.get(id)?.cancel();
        const animation = element.animate(
          [{ transform: `translate(${x}px, ${y}px)` }, { transform: 'translate(0, 0)' }],
          { duration: 220, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
        );
        moveAnimations.current.set(id, animation);
        animation.onfinish = () => {
          if (moveAnimations.current.get(id) === animation) moveAnimations.current.delete(id);
        };
      });
    });
  }

  function reorder(sourceId: string, targetId: string, before: boolean) {
    setSnackbar(null);
    setOrderWithAnimation(reorderExerciseInOrder(orderRef.current, sourceId, targetId, before));
  }

  function previewReorder(targetId: string, before: boolean) {
    if (!draggedId) return;
    setDropTargetId(targetId);
    reorder(draggedId, targetId, before);
  }

  async function saveOrder() {
    setSaving(true);
    setSnackbar(null);
    try {
      await saveProfile({ ...profile, exerciseOrder: order, updatedAt: now(), revision: profile.revision + 1 });
      setSnackbar({ message: 'Custom order saved for future plans.', tone: 'success' });
    } catch {
      setSnackbar({ message: 'Could not save the custom order. Try again.', tone: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function resetOrder() {
    const nextOrder = normalizeExerciseOrder(undefined);
    orderRef.current = nextOrder;
    setOrder(nextOrder);
    setSnackbar(null);
  }

  const visibleExercises = order
    .map((id) => EXERCISES.find((exercise) => exercise.id === id))
    .filter((exercise): exercise is Exercise => Boolean(exercise))
    .filter((exercise) => matchesExercise(exercise, filterArea, search));

  return (
    <Page title="Exercise order" subtitle="Set the sequence used when you choose Custom order in a workout plan.">
      <div className="exercise-order-layout">
        <section className="editor-section exercise-order-card">
          <div className="section-heading"><div><p className="eyebrow">Library preference</p><h2>Your sequence</h2></div><span className="count-badge">{order.length} exercises</span></div>
          <p className="section-explainer">Drag an exercise into place or use the arrows. This preference is shared by every new plan.</p>
          <div className="search-box"><Dumbbell size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search exercises" aria-label="Search exercises" /></div>
          <div className="filter-row" aria-label="Exercise groups"><button className={filterArea === 'all' ? 'active' : ''} type="button" onClick={() => setFilterArea('all')}>All</button><button className={filterArea === 'aerobic' ? 'active' : ''} type="button" onClick={() => setFilterArea('aerobic')}>Cardio (aerobic)</button>{AREAS.filter((area) => area !== 'full-body').map((area) => <button className={filterArea === area ? 'active' : ''} type="button" key={area} onClick={() => setFilterArea(area)}>{AREA_LABELS[area]}</button>)}</div>
          <p className="library-results">{visibleExercises.length} {visibleExercises.length === 1 ? 'exercise' : 'exercises'} shown</p>
          <div className="exercise-order-list">
            {visibleExercises.map((exercise) => {
              const index = order.indexOf(exercise.id);
              return <ExerciseOrderItem key={exercise.id} exercise={exercise} index={index} dragged={draggedId === exercise.id} dropTarget={dropTargetId === exercise.id && draggedId !== exercise.id} canMoveUp={index > 0} canMoveDown={index < order.length - 1} itemRef={(element) => { if (element) itemRefs.current.set(exercise.id, element); else itemRefs.current.delete(exercise.id); }} onMove={move} onDragStart={(id) => { setDraggedId(id); setDropTargetId(null); }} onDragOver={previewReorder} onDragEnd={() => { setDraggedId(null); setDropTargetId(null); }} onDrop={(sourceId, targetId, before) => { reorder(sourceId, targetId, before); setDropTargetId(null); }} />;
            })}
          </div>
          <div className="exercise-order-actions">
            <button type="button" className="button ghost" onClick={resetOrder}>Reset to popularity</button>
            <button type="button" className="button primary" onClick={saveOrder} disabled={saving}>{saving ? 'Saving…' : 'Save order'} <Check size={16} /></button>
          </div>
        </section>
        <aside className="settings-side">
          <section className="side-card section-explainer-card">
            <Dumbbell size={20} />
            <h3>How it works</h3>
            <p>Use the Exercise library’s Custom order sort to see this sequence while adding exercises to a plan.</p>
          </section>
        </aside>
      </div>
      {snackbar && <Snackbar message={snackbar.message} tone={snackbar.tone} onDismiss={dismissSnackbar} />}
    </Page>
  );
}

function matchesExercise(exercise: Exercise, filterArea: Area | 'aerobic' | 'all', search: string): boolean {
  const matchesArea = filterArea === 'all' || filterArea === 'aerobic' || exercise.primaryAreas.includes(filterArea) || exercise.secondaryAreas.includes(filterArea);
  const matchesType = filterArea !== 'aerobic' || exercise.exerciseType === 'aerobic';
  const searchableText = `${exercise.name} ${exercise.equipment ?? ''} ${exercise.exerciseType ?? 'strength'}`.toLowerCase();
  return matchesArea && matchesType && searchableText.includes(search.toLowerCase());
}

function ExerciseOrderItem({ exercise, index, dragged, dropTarget, canMoveUp, canMoveDown, itemRef, onMove, onDragStart, onDragOver, onDragEnd, onDrop }: { exercise: typeof EXERCISES[number]; index: number; dragged: boolean; dropTarget: boolean; canMoveUp: boolean; canMoveDown: boolean; itemRef: (element: HTMLElement | null) => void; onMove: (id: string, direction: -1 | 1) => void; onDragStart: (id: string) => void; onDragOver: (id: string, before: boolean) => void; onDragEnd: () => void; onDrop: (sourceId: string, targetId: string, before: boolean) => void }) {
  const areas = exercise.primaryAreas.map((area) => AREA_LABELS[area]).join(', ');
  const details = [areas, exercise.equipment, exercise.exerciseType === 'aerobic' ? 'Cardio (aerobic)' : undefined].filter(Boolean).join(' · ');

  return (
    <article ref={itemRef} className={`exercise-order-item ${dragged ? 'dragging' : ''} ${dropTarget ? 'drop-target' : ''}`} draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', exercise.id); onDragStart(exercise.id); }} onDragEnd={onDragEnd} onDragOver={(event) => { event.preventDefault(); const bounds = event.currentTarget.getBoundingClientRect(); onDragOver(exercise.id, event.clientY < bounds.top + bounds.height / 2); }} onDrop={(event) => { event.preventDefault(); const bounds = event.currentTarget.getBoundingClientRect(); onDrop(event.dataTransfer.getData('text/plain'), exercise.id, event.clientY < bounds.top + bounds.height / 2); }}>
      <GripVertical className="exercise-order-grip" size={17} aria-hidden="true" />
      <span className="sequence-number">{String(index + 1).padStart(2, '0')}</span>
      <div className="exercise-order-item-main"><strong>{exercise.name}</strong><small>{details}</small></div>
      <div className="exercise-order-controls">
        <button type="button" className="icon-button" onClick={() => onMove(exercise.id, -1)} disabled={!canMoveUp} aria-label={`Move ${exercise.name} earlier`}><ChevronUp size={16} /></button>
        <button type="button" className="icon-button" onClick={() => onMove(exercise.id, 1)} disabled={!canMoveDown} aria-label={`Move ${exercise.name} later`}><ChevronDown size={16} /></button>
      </div>
    </article>
  );
}
