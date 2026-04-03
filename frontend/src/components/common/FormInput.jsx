export default function FormInput({
  label,
  type = 'text',
  name,
  value,
  onChange,
  error,
  placeholder,
  required = false,
  options = [],
  rows = 3,
  disabled = false,
  className = '',
}) {
  const base =
    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed';
  const borderClass = error ? 'border-red-400' : 'border-gray-300';

  const renderInput = () => {
    if (type === 'select') {
      return (
        <select
          name={name}
          value={value ?? ''}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`${base} ${borderClass} ${className}`}
        >
          <option value="">{placeholder || `Select ${label}`}</option>
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lbl = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={val} value={val}>
                {lbl}
              </option>
            );
          })}
        </select>
      );
    }

    if (type === 'textarea') {
      return (
        <textarea
          name={name}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          className={`${base} ${borderClass} resize-none ${className}`}
        />
      );
    }

    return (
      <input
        type={type}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`${base} ${borderClass} ${className}`}
      />
    );
  };

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {renderInput()}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
