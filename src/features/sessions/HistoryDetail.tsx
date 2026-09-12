import { useState } from 'react';
import { BarChart3, CircleCheck, Clock3, Info, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { FOCUS_LABELS, INTENSITY_LABELS, type WorkoutRecord } from '../../domain';
import type { PlannerData } from '../../data/db';
import { deleteWorkoutRecord, now } from '../../data/db';
import { formatDateTime, formatLongDate } from '../../shared/formatters';
import { EmptyState, Page } from '../../shared/ui';

export function HistoryDetail({ data }: { data: PlannerData }) {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const record = data.records.find((item) => item.id === recordId);

  if (!record) {
    return <Page title="History unavailable" subtitle="This record could not be found."><EmptyState icon={<BarChart3 size={22} />} title="No workout record here" body="Records are kept separately from the plan that created them." action={<Link className="button secondary" to="/progress">Back to progress</Link>} /></Page>;
  }

  const filledSets = record.sets.filter((set) => set.actualReps !== null || set.actualDurationSeconds !== null || set.loadKg !== null || set.rir !== null && set.rir !== undefined);
  const focus = record.planSnapshot.focus ?? record.planSnapshot.primaryTargetArea;
  const intensity = record.planSnapshot.intensity ?? 'moderate';
  const currentRecord = record;

  async function deleteRecord() {
    setDeleting(true);
    setError('');
    try {
      await deleteWorkoutRecord(currentRecord.id);
      navigate('/progress');
    } catch {
      setError('The workout record could not be deleted. Try again.');
      setDeleting(false);
    }
  }

  return (
    <Page title={record.planSnapshot.name} subtitle={`Historical record · ${formatLongDate(record.sessionDate)}`} backTo="/progress" action={<button className="button danger-button" type="button" onClick={() => setDeleteOpen(true)}><Trash2 size={16} /> Delete record</button>}>
      <div className="history-detail">
        <div className="history-status"><span className={`status-pill ${record.status}`}>{record.status === 'completed' ? <CircleCheck size={15} /> : <Clock3 size={15} />}{record.status === 'completed' ? 'Completed' : 'In progress'}</span><span className="muted">{filledSets.length ? `${filledSets.length} set entries recorded` : 'No performance entries'}</span></div>
        <section className="detail-section">
          <div className="section-heading"><div><p className="eyebrow">What you followed</p><h2>{record.planSnapshot.prescriptions.length} exercises</h2></div><span className="area-pill">{FOCUS_LABELS[focus]} · {INTENSITY_LABELS[intensity]}</span></div>
          {record.planSnapshot.prescriptions.map((prescription, index) => <HistoryExercise key={prescription.id} prescription={prescription} index={index} record={record} />)}
        </section>
        <div className="snapshot-note"><Info size={17} /><p>This is a snapshot of the plan on {formatDateTime(record.planSnapshot.estimate?.calculatedAt ?? now())}. Editing or deleting the source plan won’t rewrite this record.</p></div>
        {error && <p className="form-error global-error" role="alert">{error}</p>}
      </div>
      {deleteOpen && <DeleteRecordModal recordName={record.planSnapshot.name} deleting={deleting} onCancel={() => setDeleteOpen(false)} onDelete={deleteRecord} />}
    </Page>
  );
}

export function DeleteRecordModal({ recordName, deleting, onCancel, onDelete }: { recordName: string; deleting: boolean; onCancel: () => void; onDelete: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) onCancel(); }}><div className="delete-data-modal" role="dialog" aria-modal="true" aria-labelledby="delete-record-title"><div className="warning-icon"><Trash2 size={20} /></div><p className="eyebrow">Delete workout record</p><h2 id="delete-record-title">Delete this session?</h2><p>This removes the saved {recordName} record from your history. The workout plan itself will stay unchanged.</p><div className="modal-actions"><button type="button" className="button ghost" onClick={onCancel} disabled={deleting}>Cancel</button><button type="button" className="button danger-button" onClick={onDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete record'}</button></div></div></div>;
}

function HistoryExercise({ prescription, index, record }: { prescription: WorkoutRecord['planSnapshot']['prescriptions'][number]; index: number; record: WorkoutRecord }) {
  const exerciseName = record.planSnapshot.exercises.find((exercise) => exercise.id === prescription.exerciseId)?.name ?? 'Exercise';
  const doseLabel = prescription.dose.kind === 'reps' ? 'reps' : 'sec';
  const recordedSets = record.sets.filter((set) => set.prescriptionId === prescription.id);

  return <div className="history-exercise"><div><span className="sequence-number">{String(index + 1).padStart(2, '0')}</span><strong>{exerciseName}</strong></div><span>{prescription.sets} × {prescription.dose.value} {doseLabel}</span><div className="history-set-list">{recordedSets.map((set) => <span key={set.setNumber}>Set {set.setNumber}: {set.actualReps ?? set.actualDurationSeconds ?? '—'} · {set.loadKg === null ? 'weight/resistance unknown' : `${set.loadKg} kg`}{set.rir === null || set.rir === undefined ? '' : ` · ${set.rir} RIR (reps left)`}</span>)}</div></div>;
}
