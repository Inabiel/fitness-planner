import { useEffect, useState, type FormEvent } from 'react';
import { Check, Info, Trash2, UserRound } from 'lucide-react';
import {
  ACTIVITY_LABELS,
  EXPERIENCE_LABELS,
  GOALS,
  GOAL_LABELS,
  calculateEstimates,
  type Profile,
} from '../../domain';
import { clearAllData, now, saveProfile } from '../../data/db';
import { Field, Page } from '../../shared/ui';
import { formToCalculationProfile, isActivityLevel, isCompleteProfileForm, isExperience, isGoal, isSex, profileToForm } from './form';

export function ProfileSettings({ profile }: { profile: Profile }) {
  const [form, setForm] = useState(profileToForm(profile));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const estimate = isCompleteProfileForm(form) ? calculateEstimates(formToCalculationProfile(form)) : null;

  useEffect(() => {
    if (!deleteModalOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !deleting) setDeleteModalOpen(false);
    }

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [deleteModalOpen, deleting]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!isCompleteProfileForm(form)) {
      setMessage('Complete every field before saving.');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      await saveProfile({
        id: 'profile',
        ...formToCalculationProfile(form),
        secondaryGoals: form.secondaryGoals,
        exerciseOrder: profile.exerciseOrder,
        updatedAt: now(),
        revision: profile.revision + 1,
      });
      setMessage('Profile saved. Existing plan estimates stay as saved.');
    } catch {
      setMessage('Could not save your profile. Try again.');
    } finally {
      setSaving(false);
    }
  }

  function openDeleteModal() {
    setDeleteError('');
    setDeleteModalOpen(true);
  }

  async function deleteAllData() {
    setDeleting(true);
    setDeleteError('');
    try {
      await clearAllData();
      window.location.hash = '#/onboarding';
      window.location.reload();
    } catch {
      setDeleteError('Your data could not be deleted. Try again.');
      setDeleting(false);
    }
  }

  return (
    <Page title="Profile settings" subtitle="Keep your baseline current. Saved plans won’t change without your say-so.">
      <div className="settings-layout">
        <form className="settings-form" onSubmit={save}>
          <section className="editor-section">
            <div className="section-heading"><div><p className="eyebrow">Fitness profile</p><h2>Your baseline</h2></div><UserRound size={19} /></div>
            <div className="field-grid">
              <Field label="Name"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
              <Field label="Age"><input type="number" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} /></Field>
              <Field label="Sex"><select value={form.sex} onChange={(event) => { if (isSex(event.target.value)) setForm({ ...form, sex: event.target.value }); }}><option value="female">Female</option><option value="male">Male</option></select></Field>
              <Field label="Height" suffix="cm"><input type="number" value={form.heightCm} onChange={(event) => setForm({ ...form, heightCm: event.target.value })} /></Field>
              <Field label="Body weight" suffix="kg"><input type="number" step="0.1" value={form.weightKg} onChange={(event) => setForm({ ...form, weightKg: event.target.value })} /></Field>
              <Field label="Activity"><select value={form.activityLevel} onChange={(event) => { if (isActivityLevel(event.target.value)) setForm({ ...form, activityLevel: event.target.value }); }}>{Object.entries(ACTIVITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            </div>
            <div className="settings-split">
              <Field label="Experience"><select value={form.experience} onChange={(event) => { if (isExperience(event.target.value)) setForm({ ...form, experience: event.target.value }); }}>{Object.entries(EXPERIENCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
              <Field label="Primary goal"><select value={form.primaryGoal} onChange={(event) => { if (isGoal(event.target.value)) setForm({ ...form, primaryGoal: event.target.value }); }}>{GOALS.map((goal) => <option key={goal} value={goal}>{GOAL_LABELS[goal]}</option>)}</select></Field>
            </div>
          </section>
          <div className="settings-actions">
            {message && <p className="save-message" role="status">{message}</p>}
            <button className="button primary" disabled={saving}>{saving ? 'Saving…' : 'Save profile changes'} <Check size={16} /></button>
          </div>
        </form>
        <aside className="settings-side">
          <div className="side-card">
            <p className="eyebrow">Current estimate</p>
            {estimate && <><strong className="settings-calories">{estimate.dailyCalories.toLocaleString()} <small>calories/day</small></strong><div className="saved-macros"><span>{estimate.proteinGrams}g protein</span><span>{estimate.carbohydrateGrams}g carbohydrates</span><span>{estimate.fatGrams}g fat</span></div><p className="fine-print">BMI (body mass index): {estimate.bmi.toFixed(1)}. This is a height-to-weight screening number, not a diagnosis.</p></>}
          </div>
          <div className="side-card privacy-card"><Info size={18} /><h3>Local by default</h3><p>Your profile, plans, measurements, and workout records stay in this browser on this device. Clearing browser data may remove them. No account or sync is involved.</p></div>
          <div className="side-card danger-zone">
            <p className="eyebrow">Danger zone</p>
            <h3>Delete all local data</h3>
            <p>This permanently removes your profile, plans, workout history, and body-weight records from this browser.</p>
            <button type="button" className="button danger-button full-width" onClick={openDeleteModal} disabled={deleting}>Delete all data</button>
          </div>
        </aside>
      </div>
      {deleteModalOpen && <DeleteDataModal deleting={deleting} error={deleteError} onCancel={() => setDeleteModalOpen(false)} onDelete={deleteAllData} />}
    </Page>
  );
}

function DeleteDataModal({ deleting, error, onCancel, onDelete }: { deleting: boolean; error: string; onCancel: () => void; onDelete: () => void }) {
  return (
    <div className="modal-backdrop">
      <div className="delete-data-modal" role="dialog" aria-modal="true" aria-labelledby="delete-data-modal-title">
        <div className="warning-icon"><Trash2 size={20} /></div>
        <p className="eyebrow">Danger zone</p>
        <h2 id="delete-data-modal-title">Delete all local data?</h2>
        <p className="muted">Your profile, plans, workout history, and body-weight records will be permanently removed from this browser. This cannot be undone.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="button ghost" onClick={onCancel} disabled={deleting} autoFocus>Cancel</button>
          <button type="button" className="button danger-button" onClick={onDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete all data'}</button>
        </div>
      </div>
    </div>
  );
}
