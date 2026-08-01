import { useState } from "react";

interface AddMealModalProps {
  onSave: (name: string) => void;
  onClose: () => void;
}

export function AddMealModal({ onSave, onClose }: AddMealModalProps) {
  const [name, setName] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h3>New meal</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <form className="modal-form" onSubmit={submit}>
          <label className="field">
            <span>Meal name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pre-workout"
              autoFocus
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              Add meal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
