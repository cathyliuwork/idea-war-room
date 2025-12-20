'use client';

import { X, Plus } from 'lucide-react';

interface ArrayFieldInputProps {
  label: string;
  helperText?: string;
  maxLength: number;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
  error?: string;
  addButtonLabel?: string;
  noItemsText?: string;
}

export default function ArrayFieldInput({
  label,
  helperText,
  maxLength,
  placeholder,
  values,
  onChange,
  error,
  addButtonLabel = 'Add Another',
  noItemsText = 'No items added yet. Click the button below to add one.',
}: ArrayFieldInputProps) {
  const handleAdd = () => {
    onChange([...values, '']);
  };

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, value: string) => {
    const newValues = [...values];
    newValues[index] = value;
    onChange(newValues);
  };

  const getCharCounterColor = (length: number) => {
    const percentage = (length / maxLength) * 100;
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-orange-500';
    return 'text-text-tertiary';
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          {label}
        </label>
        {helperText && (
          <p className="text-xs text-text-secondary mb-2">{helperText}</p>
        )}
      </div>

      <div className="space-y-2">
        {values.length === 0 && (
          <p className="text-sm text-text-tertiary italic">
            {noItemsText}
          </p>
        )}

        {values.map((value, index) => (
          <div key={index} className="flex gap-2 items-start">
            <div className="flex-1">
              <input
                type="text"
                value={value}
                onChange={(e) => handleChange(index, e.target.value)}
                maxLength={maxLength}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-border-medium rounded-lg focus:border-brand-primary focus:ring-2 focus:ring-brand-light outline-none transition-colors text-text-primary"
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs ${getCharCounterColor(value.length)}`}>
                  {value.length} / {maxLength}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              aria-label="Remove"
              className="mt-2 p-2 text-text-secondary hover:text-severity-1-catastrophic transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 text-sm text-brand-primary hover:text-brand-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{addButtonLabel}</span>
        </button>
      </div>

      {error && (
        <p className="text-sm text-severity-1-catastrophic mt-1">{error}</p>
      )}
    </div>
  );
}
