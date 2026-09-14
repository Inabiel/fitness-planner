import { Clipboard, Trash2 } from 'lucide-react';

export function CopyPlanModal({ includeSteps, saving, onIncludeStepsChange, onCancel, onCopy }: { includeSteps: boolean; saving: boolean; onIncludeStepsChange: (value: boolean) => void; onCancel: () => void; onCopy: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onCancel(); }}>
      <div className="review-confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="copy-plan-title">
        <div className="confirmation-icon"><Clipboard size={20} /></div>
        <p className="eyebrow">Copy workout plan</p>
        <h2 id="copy-plan-title">Choose what to copy</h2>
        <p className="muted">The plan summary is always included. Add exercise steps when you want the movement instructions in your message too.</p>
        <label className="confirm-row">
          <input type="checkbox" checked={includeSteps} onChange={(event) => onIncludeStepsChange(event.target.checked)} />
          <span><strong>Include exercise steps</strong><small>Copies each exercise’s plan, rest, notes, and written instructions.</small></span>
        </label>
        <div className="modal-actions">
          <button type="button" className="button ghost" onClick={onCancel} disabled={saving} autoFocus>Cancel</button>
          <button type="button" className="button primary" onClick={onCopy} disabled={saving}>{saving ? 'Copying…' : 'Copy plan text'} <Clipboard size={16} /></button>
        </div>
      </div>
    </div>
  );
}

export function DeletePlanModal({ planName, error, saving, onCancel, onDelete }: { planName: string; error: string; saving: boolean; onCancel: () => void; onDelete: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onCancel(); }}><div className="delete-data-modal" role="dialog" aria-modal="true" aria-labelledby="delete-plan-title"><div className="warning-icon"><Trash2 size={20} /></div><p className="eyebrow">Delete workout plan</p><h2 id="delete-plan-title">Delete {planName}?</h2><p>Future sessions will disappear, but recorded history will be retained.</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="button ghost" onClick={onCancel} disabled={saving} autoFocus>Cancel</button><button type="button" className="button danger-button" onClick={onDelete} disabled={saving}>{saving ? 'Deleting…' : 'Delete plan'}</button></div></div></div>;
}
