'use client';

import { useRef, useState } from 'react';
import { Plus, Check } from 'lucide-react';

interface CreatableSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  /** Called when the user commits a brand-new option. Should persist and return updated list. */
  onAdd: (newValue: string) => Promise<void>;
}

export default function CreatableSelect({ label, value, options, onChange, onAdd }: CreatableSelectProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = async () => {
    const trimmed = draft.trim();
    if (!trimmed) { setAdding(false); setDraft(''); return; }
    setLoading(true);
    await onAdd(trimmed);
    onChange(trimmed);
    setLoading(false);
    setAdding(false);
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { setAdding(false); setDraft(''); }
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>

      {adding ? (
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <input
            ref={inputRef}
            autoFocus
            className="input"
            placeholder={`New ${label.toLowerCase()}…`}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commit}
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="btn btn-primary btn-icon"
            onClick={commit}
            disabled={loading || !draft.trim()}
            title="Confirm"
          >
            <Check size={14} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <select
            className="select"
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{ flex: 1 }}
          >
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            onClick={() => setAdding(true)}
            title={`Add new ${label.toLowerCase()}`}
          >
            <Plus size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
